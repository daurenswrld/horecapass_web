'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { billingApi, type BillingOrder } from '@/lib/api/billing';
import { useAuth } from '@/lib/auth/context';
import { isCompany } from '@/lib/api/auth';
import { Button, Spinner } from '@/components/ui/primitives';

function CheckoutReturn() {
  const search = useSearchParams();
  const { user } = useAuth();
  const id = search.get('order') ?? '';
  const cancelled = search.get('cancelled') === '1';
  const [order, setOrder] = React.useState<BillingOrder | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const load = React.useCallback(async () => {
    setError(null);
    try {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error();
      const value = await billingApi.order(id);
      if (!value.is_test || value.fulfillment !== 'test_only_no_live_access') throw new Error();
      setOrder(value);
    } catch { setError('Could not confirm this test order. Retry; the return address alone does not confirm payment.'); }
    finally { setLoading(false); }
  }, [id]);
  React.useEffect(() => { void load(); }, [load]);
  React.useEffect(() => {
    if (order?.status !== 'pending' || cancelled || error) return;
    let count = 0;
    const timer = setInterval(() => { if (++count <= 10) void load(); else clearInterval(timer); }, 3000);
    return () => clearInterval(timer);
  }, [order?.status, cancelled, error, load]);
  if (loading) return <div className="grid place-items-center py-20"><Spinner /></div>;
  return <div className="mx-auto max-w-xl space-y-5 px-5 py-12">
    <h1 className="text-2xl font-bold text-heading">{order?.status === 'paid' ? 'Test payment confirmed' : order?.status === 'refunded' || order?.status === 'partially_refunded' ? 'Test refund recorded' : cancelled ? 'Checkout closed' : order?.status === 'expired' ? 'Test checkout expired' : 'Checking test payment'}</h1>
    <p className="text-text-secondary">This is a Stripe test purchase. No real money is charged and no live vacancy or paid feature is activated.</p>
    {order && <p className="text-sm">Order: {order.id}<br />Amount: {order.amount / 100} {order.currency.toUpperCase()}<br />Status: {order.status}</p>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    {order?.status === 'pending' && <p className="text-sm text-text-secondary">Waiting for Stripe confirmation. Closing checkout does not prove that a payment failed.</p>}
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" onClick={() => void load()}>Check again</Button>
      <Link className="inline-flex items-center font-semibold text-accent-text" href={isCompany(user?.role ?? '') ? '/company/onboarding?step=payment' : '/onboarding?step=upgrade'}>Return to your profile</Link>
    </div>
  </div>;
}

export default function BillingReturnPage() {
  return <React.Suspense fallback={<div className="grid place-items-center py-20"><Spinner /></div>}><CheckoutReturn /></React.Suspense>;
}
