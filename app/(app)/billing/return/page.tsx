'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FlaskConical, RefreshCcw, XCircle } from 'lucide-react';
import { billingApi, type BillingOrder, type TestPlan } from '@/lib/api/billing';
import { useAuth } from '@/lib/auth/context';
import { isCompany } from '@/lib/api/auth';
import { Button, Card, Spinner } from '@/components/ui/primitives';
import { SuccessMark } from '@/components/ui/motion';

// Подписи тарифов — то же, что отдаёт /api/billing/config/, чтобы в чеке
// было «Single vacancy», а не голый код плана.
const PLAN_LABEL: Record<TestPlan, string> = {
  single: 'Single vacancy',
  bundle: 'Five vacancy bundle',
  cv_download: 'CV download',
};

function money(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={mono ? 'truncate font-mono text-xs text-text-primary' : 'font-semibold text-text-primary'}>{value}</span>
    </div>
  );
}

function StatusIcon({ status, cancelled }: { status?: BillingOrder['status']; cancelled: boolean }) {
  if (status === 'paid') return <SuccessMark />;
  if (status === 'refunded' || status === 'partially_refunded') {
    return (
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface-muted text-accent-text">
        <RefreshCcw size={30} aria-hidden />
      </span>
    );
  }
  if (cancelled || status === 'expired') {
    return (
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface-muted text-text-secondary">
        <XCircle size={30} aria-hidden />
      </span>
    );
  }
  return (
    <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface-muted">
      <Spinner />
    </span>
  );
}

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

  const title =
    order?.status === 'paid' ? 'Payment confirmed' :
    order?.status === 'refunded' || order?.status === 'partially_refunded' ? 'Refund recorded' :
    cancelled ? 'Checkout closed' :
    order?.status === 'expired' ? 'Checkout expired' :
    'Checking payment…';

  return (
    <div className="mx-auto max-w-md px-5 py-12">
      <Card className="overflow-hidden shadow-lift">
        {/* Бейдж теста — всегда на виду, не мелким текстом под капотом:
            честно про каждый чек, что это Stripe test и денег не было. */}
        <div className="flex items-center gap-2 border-b border-line bg-surface-muted px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-accent-text">
          <FlaskConical size={14} aria-hidden />
          Stripe test purchase — no real money charged
        </div>

        <div className="space-y-5 px-6 py-8 text-center">
          <StatusIcon status={order?.status} cancelled={cancelled} />
          <div>
            <h1 className="text-xl font-bold text-heading">{title}</h1>
            {order && (
              <p className="mt-1 text-3xl font-bold tracking-tight text-heading">{money(order.amount, order.currency)}</p>
            )}
          </div>

          {order && (
            <div className="divide-y divide-dashed divide-line rounded-lg border border-dashed border-line bg-surface-muted/40 px-4 text-left">
              <Row label="Item" value={PLAN_LABEL[order.plan] ?? order.plan} />
              <Row label="Status" value={order.status} />
              {order.refunded_amount > 0 && <Row label="Refunded" value={money(order.refunded_amount, order.currency)} />}
              <Row label="Order" value={order.id} mono />
            </div>
          )}

          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          {order?.status === 'pending' && !error && (
            <p className="text-sm text-text-secondary">Waiting for Stripe confirmation. Closing checkout does not prove that a payment failed.</p>
          )}
          <p className="text-xs text-text-secondary">No live vacancy or paid feature is activated by this purchase.</p>

          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <Button variant="secondary" onClick={() => void load()}>Check again</Button>
            <Link
              className="inline-flex items-center font-semibold text-accent-text underline-offset-4 hover:underline"
              href={isCompany(user?.role ?? '') ? '/company/onboarding?step=payment' : '/onboarding?step=upgrade'}
            >
              Return to your profile
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function BillingReturnPage() {
  return <React.Suspense fallback={<div className="grid place-items-center py-20"><Spinner /></div>}><CheckoutReturn /></React.Suspense>;
}
