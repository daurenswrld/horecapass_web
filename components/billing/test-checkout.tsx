'use client';

import * as React from 'react';
import { Button } from '@/components/ui/primitives';
import { billingApi, checkoutDestination, type BillingConfig, type TestPlan } from '@/lib/api/billing';
import { useAuth } from '@/lib/auth/context';
import { canSyncToServer } from '@/lib/demo/employer-sync';

export function StripeTestCheckout({ plan, resourceId, prepareResource }: {
  plan: TestPlan; resourceId?: number | null; prepareResource?: () => Promise<number>;
}) {
  const { user } = useAuth();
  const [config, setConfig] = React.useState<BillingConfig | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!canSyncToServer()) return;
    let alive = true;
    void billingApi.config().then((value) => { if (alive) setConfig(value); }).catch(() => undefined);
    return () => { alive = false; };
  }, [user?.id]);
  if (config?.mode !== 'test' || !user || !canSyncToServer()) return null;
  const start = async () => {
    setError(null);
    setBusy(true);
    try {
      const id = prepareResource ? await prepareResource() : resourceId;
      if (!id || !Number.isSafeInteger(id) || id < 1) throw new Error('Save your profile or vacancy before testing checkout.');
      const cacheKey = `hp_stripe_test_request:${user.id}:${plan}:${id}`;
      // Keep the key on network failure so retries cannot create duplicate purchases.
      let requestKey = localStorage.getItem(cacheKey);
      if (!requestKey) { requestKey = crypto.randomUUID(); localStorage.setItem(cacheKey, requestKey); }
      const order = await billingApi.checkout(plan, id, requestKey);
      window.location.assign(checkoutDestination(order));
    } catch {
      setError('Could not open test checkout. No purchase was confirmed here. Retry or contact support.');
      setBusy(false);
    }
  };
  const price = config.plans.find((item) => item.id === plan);
  return <div className="space-y-2 rounded-lg border border-line bg-surface-muted p-4">
    <p className="text-sm font-semibold text-heading">Stripe test checkout</p>
    <p className="text-sm text-text-secondary">Test cards only. No real payment, vacancy publication, or paid access. Free launch options remain available.</p>
    <Button variant="secondary" disabled={busy || (!prepareResource && !resourceId)} onClick={() => void start()}>
      {busy ? 'Opening…' : `Test ${price ? `${price.amount / 100} ${price.currency.toUpperCase()}` : 'checkout'}`}
    </Button>
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
  </div>;
}
