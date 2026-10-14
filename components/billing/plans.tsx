'use client';

import * as React from 'react';
import { Check, ExternalLink, Sparkles, Tag } from 'lucide-react';
import { Button, Field } from '@/components/ui/primitives';
import {
  billingApi,
  billingError,
  checkoutDestination,
  money,
  portalDestination,
  type BillingAccess,
  type BillingConfig,
  type Product,
  type PromoQuote,
} from '@/lib/api/billing';
import { useAuth } from '@/lib/auth/context';
import { cn } from '@/lib/utils';

/** What each plan gives, in the words of the Figma "Choose a plan" (E-26). */
const FEATURES: Record<string, string[]> = {
  single: ['1 job vacancy', 'Visible for 30 days', 'Basic candidate matching', 'Standard support'],
  subscription: ['Unlimited job vacancies', 'Visible for 30 days each', 'Access to verified candidates', 'Priority support'],
  premium: [
    'Unlimited job vacancies',
    'Featured placement',
    'Access to all candidates and their contacts',
    'Dedicated account manager',
    'Hide your company name',
    'Priority support',
  ],
};

const TAGLINE: Record<string, string> = {
  single: 'Post one job vacancy.',
  subscription: 'Unlimited vacancies with a monthly plan.',
  premium: 'All features for maximum hiring results.',
};

/** Catalog, payment mode and what the account already has. */
export function useBilling(audience: 'candidate' | 'employer') {
  const { user } = useAuth();
  const [config, setConfig] = React.useState<BillingConfig | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [access, setAccess] = React.useState<BillingAccess | null>(null);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    Promise.all([
      billingApi.config(),
      billingApi.products(audience),
      user ? billingApi.access().catch(() => null) : Promise.resolve(null),
    ])
      .then(([c, p, a]) => {
        if (!alive) return;
        setConfig(c);
        setProducts(p);
        setAccess(a);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [audience, user]);
  return { config, products, access, failed };
}

/** Starts a purchase and leaves for Stripe (or the return page for a free code). */
function useCheckout() {
  const { user } = useAuth();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const pay = async (plan: string, opts: { resourceId?: number | null; promoCode?: string | null } = {}) => {
    if (!user) return;
    setError(null);
    setBusy(true);
    try {
      // One key per attempt: a network retry reuses it and cannot buy twice.
      const cacheKey = `hp_checkout:${user.id}:${plan}:${opts.resourceId ?? 0}:${opts.promoCode ?? ''}`;
      let requestKey: string | null = null;
      try {
        requestKey = localStorage.getItem(cacheKey);
      } catch {}
      if (!requestKey) {
        requestKey = crypto.randomUUID();
        try {
          localStorage.setItem(cacheKey, requestKey);
        } catch {}
      }
      const order = await billingApi.checkout(plan, requestKey, opts);
      if (order.status !== 'pending') {
        try {
          localStorage.removeItem(cacheKey);
        } catch {}
      }
      window.location.assign(checkoutDestination(order));
    } catch (e) {
      setError(billingError(e, 'Could not open the payment page. Nothing was charged — please try again.'));
      setBusy(false);
    }
  };
  return { pay, busy, error };
}

function PromoField({ plan, monthly, onQuote }: {
  plan: string | null;
  monthly?: boolean;
  onQuote: (quote: PromoQuote | null) => void;
}) {
  const [code, setCode] = React.useState('');
  const [quote, setQuote] = React.useState<PromoQuote | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => {
    setQuote(null);
    onQuote(null);
    setError(null);
    // A code checked for one plan may not apply to another.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);
  const apply = async () => {
    if (!plan || !code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const value = await billingApi.promo(plan, code.trim());
      setQuote(value);
      onQuote(value);
    } catch (e) {
      setQuote(null);
      onQuote(null);
      setError(billingError(e, 'Could not check the code. Please try again.'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Field
            label="Promo code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && void apply()}
            placeholder="Optional"
            autoComplete="off"
            error={error}
          />
        </div>
        <Button variant="secondary" disabled={busy || !plan || !code.trim()} onClick={() => void apply()}>
          <Tag size={15} aria-hidden />
          {busy ? 'Checking…' : 'Apply'}
        </Button>
      </div>
      {quote && (
        <p className="text-sm text-text-primary">
          <span className="font-semibold text-accent-text">{quote.promo_code}</span>{' '}
          {quote.total === 0
            ? '— free, no card needed.'
            : monthly
              ? `— ${money(quote.discount, quote.currency)} off the first month: ${money(quote.total, quote.currency)}, then ${money(quote.price, quote.currency)} a month.`
              : `— ${money(quote.discount, quote.currency)} off, you pay ${money(quote.total, quote.currency)}.`}
        </p>
      )}
    </div>
  );
}

function payable(config: BillingConfig | null) {
  return config?.mode === 'test' || config?.mode === 'live';
}

function TestNotice({ config }: { config: BillingConfig | null }) {
  if (config?.mode !== 'test') return null;
  return (
    <p className="rounded-md bg-surface-muted px-3 py-2 text-xs text-text-secondary">
      Stripe test mode: use a test card (4242 4242 4242 4242). No real money is charged.
    </p>
  );
}

/** E-26 "Choose a plan": One-time vacancy, Subscription, Premium. */
export function EmployerPlans({ resourceId, lead }: { resourceId?: number | null; lead?: React.ReactNode }) {
  const { config, products, access, failed } = useBilling('employer');
  const { pay, busy, error } = useCheckout();
  const [picked, setPicked] = React.useState<string>('subscription');
  const [quote, setQuote] = React.useState<PromoQuote | null>(null);
  const current = access?.company?.plan ?? null;

  if (failed) return <p className="text-sm text-text-secondary">Plans could not be loaded. Please refresh the page.</p>;
  if (!config) return null;

  const free = quote?.total === 0;
  const canPay = payable(config) || free;
  return (
    <div className="space-y-5">
      {lead}
      <div className="grid gap-4 md:grid-cols-3">
        {products.map((p) => {
          const on = picked === p.code;
          return (
            <button
              key={p.code}
              type="button"
              onClick={() => setPicked(p.code)}
              aria-pressed={on}
              className={cn(
                'flex flex-col rounded-lg border bg-surface p-5 text-left transition-shadow focus-ring',
                on ? 'border-[1.5px] border-accent-strong shadow-lift dark:border-accent' : 'border-line hover:shadow-card',
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold text-heading">{p.name}</span>
                {current === p.code ? (
                  <span className="rounded-full bg-accent-muted px-2.5 py-0.5 text-xs font-semibold text-accent-text">Your plan</span>
                ) : p.code === 'subscription' ? (
                  <span className="rounded-full bg-accent-muted px-2.5 py-0.5 text-xs font-semibold text-accent-text">Popular</span>
                ) : null}
              </span>
              <span className="mt-1 text-sm text-text-secondary">{TAGLINE[p.code] ?? p.description}</span>
              <span className="mt-3 text-3xl font-bold text-heading">{money(p.price, p.currency)}</span>
              <span className="text-sm text-text-secondary">{p.kind === 'SUBSCRIPTION' ? 'per month' : 'one-time payment'}</span>
              <ul className="mt-4 space-y-1.5 text-sm text-text-primary">
                {(FEATURES[p.code] ?? []).map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check size={15} aria-hidden className="mt-0.5 shrink-0 text-accent-text" />
                    {line}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
      <div className="max-w-md space-y-3">
        <PromoField
          plan={picked}
          monthly={products.find((p) => p.code === picked)?.kind === 'SUBSCRIPTION'}
          onQuote={setQuote}
        />
        <TestNotice config={config} />
        {!canPay && <p className="text-sm text-text-secondary">Online payment opens soon. A promo code already works.</p>}
        <Button
          disabled={busy || !canPay || !picked}
          onClick={() => void pay(picked, { resourceId, promoCode: quote?.promo_code })}
        >
          {busy ? 'Opening payment…' : free ? 'Activate for free' : 'Continue to payment'}
        </Button>
        {products.find((p) => p.code === picked)?.kind === 'SUBSCRIPTION' && (
          <p className="text-xs text-text-secondary">Renews every month until you cancel. Cancel any time in Plan &amp; billing.</p>
        )}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}

/** C-19 "Upgrade your resume": the professional CV to download and send. */
export function CvUpgrade({ resumeId }: { resumeId?: number | null }) {
  const { config, products, access, failed } = useBilling('candidate');
  const { pay, busy, error } = useCheckout();
  const [quote, setQuote] = React.useState<PromoQuote | null>(null);
  const product = products.find((p) => p.code === 'cv_download');
  if (failed || !config || !product) return null;
  if (access?.candidate?.cv_upgrade) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-muted px-4 py-3 text-sm text-text-primary">
        <Sparkles size={16} aria-hidden className="text-accent-text" />
        You have the professional CV — download it any time.
      </div>
    );
  }
  const free = quote?.total === 0;
  const canPay = payable(config) || free;
  return (
    <div className="space-y-4 rounded-lg border border-line bg-surface p-5">
      <div>
        <p className="font-semibold text-heading">Upgrade your resume</p>
        <p className="mt-1 text-sm text-text-secondary">
          A professionally designed, ATS-friendly resume for GCC hospitality employers. Employers on HorecaPass see your
          updated resume either way — the upgrade lets you download it and send it anywhere.
        </p>
      </div>
      <p className="text-2xl font-bold text-heading">
        {money(product.price, product.currency)} <span className="text-sm font-normal text-text-secondary">one-time payment</span>
      </p>
      <div className="max-w-md space-y-3">
        <PromoField plan={product.code} onQuote={setQuote} />
        <TestNotice config={config} />
        {!canPay && <p className="text-sm text-text-secondary">Online payment opens soon. A promo code already works.</p>}
        <Button disabled={busy || !canPay} onClick={() => void pay(product.code, { resourceId: resumeId, promoCode: quote?.promo_code })}>
          <Sparkles size={16} aria-hidden />
          {busy ? 'Opening payment…' : free ? 'Activate for free' : 'Upgrade and pay'}
        </Button>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}

/** Stripe's customer portal: card, invoices, cancel. */
export function ManageSubscription() {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const open = async () => {
    setBusy(true);
    setError(null);
    try {
      const { url } = await billingApi.portal();
      window.location.assign(portalDestination(url));
    } catch (e) {
      setError(billingError(e, 'Could not open the billing portal. Please try again.'));
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2">
      <Button variant="secondary" disabled={busy} onClick={() => void open()}>
        <ExternalLink size={15} aria-hidden />
        {busy ? 'Opening…' : 'Manage subscription'}
      </Button>
      {error && <p className="text-sm text-text-secondary">{error}</p>}
    </div>
  );
}
