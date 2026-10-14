import { ApiError, request } from './client';

/** A product of the catalog (prices and contents come from the admin). */
export interface Product {
  code: string;
  name: string;
  description: string;
  audience: 'CANDIDATE' | 'EMPLOYER';
  kind: 'ONE_TIME' | 'SUBSCRIPTION';
  /** Minor units: 9900 = 99.00. */
  price: number;
  currency: string;
  period_days: number;
}

export interface BillingConfig {
  mode: 'disabled' | 'test' | 'live';
  live_payments: boolean;
  /** Publishing is free until the paid launch (BILLING_ENFORCE off). */
  launch_free: boolean;
  premium_available: boolean;
}

export interface CompanyAccess {
  plan: string | null;
  active_until: string | null;
  unlimited_vacancies: boolean;
  vacancy_credits: number;
  candidate_base: 'NONE' | 'VERIFIED' | 'ALL';
  base_contacts: boolean;
  hide_company_name: boolean;
  featured: boolean;
}

export interface BillingAccess {
  enforced: boolean;
  company?: CompanyAccess;
  candidate?: { cv_upgrade: boolean };
}

export interface BillingOrder {
  id: string;
  plan: string;
  resource_id: number | null;
  /** What the buyer pays, after the promo code. */
  amount: number;
  discount: number;
  currency: string;
  status: 'pending' | 'paid' | 'expired' | 'refunded' | 'partially_refunded';
  is_test: boolean;
  promo_code: string | null;
  subscription: boolean;
  checkout_url: string | null;
  refunded_amount: number;
  fulfillment: 'granted' | 'none';
}

export interface PromoQuote {
  promo_code: string;
  kind: 'FREE' | 'PERCENT';
  price: number;
  discount: number;
  total: number;
  currency: string;
}

export const billingApi = {
  config: () => request<BillingConfig>('/api/billing/config/'),
  products: (audience: 'candidate' | 'employer') =>
    request<Product[]>(`/api/billing/products/?audience=${audience}`),
  access: () => request<BillingAccess>('/api/billing/access/'),
  promo: (plan: string, promoCode: string) =>
    request<PromoQuote>('/api/billing/promo/', { method: 'POST', body: { plan, promo_code: promoCode } }),
  checkout: (plan: string, requestKey: string, extra: { resourceId?: number | null; promoCode?: string | null } = {}) =>
    request<BillingOrder>('/api/billing/checkout/', {
      method: 'POST',
      body: {
        plan,
        request_key: requestKey,
        ...(extra.resourceId ? { resource_id: extra.resourceId } : {}),
        ...(extra.promoCode ? { promo_code: extra.promoCode } : {}),
      },
    }),
  order: (id: string) => request<BillingOrder>(`/api/billing/orders/${encodeURIComponent(id)}/`),
  portal: () => request<{ url: string }>('/api/billing/portal/', { method: 'POST' }),
};

/** "AED 99" / "AED 99.50". */
export function money(minor: number, currency: string): string {
  const whole = minor % 100 === 0;
  return `${currency.toUpperCase()} ${whole ? minor / 100 : (minor / 100).toFixed(2)}`;
}

/** The server's reason ("This promo code has expired.") or a fallback. */
export function billingError(e: unknown, fallback: string): string {
  if (e instanceof ApiError && e.payload && typeof e.payload === 'object') {
    const detail = (e.payload as { detail?: unknown }).detail;
    if (typeof detail === 'string' && detail) return detail;
  }
  return fallback;
}

/** Where to send the browser after /checkout/: Stripe's own page, or our
 *  return page when nothing is left to pay (a free promo code). */
export function checkoutDestination(order: BillingOrder): string {
  if (order.status !== 'pending') return `/billing/return?order=${encodeURIComponent(order.id)}`;
  const url = new URL(order.checkout_url ?? '');
  if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com' || url.username || url.password) {
    throw new Error('Unexpected checkout address.');
  }
  return url.href;
}

/** Stripe's customer portal lives on billing.stripe.com only. */
export function portalDestination(href: string): string {
  const url = new URL(href);
  if (url.protocol !== 'https:' || url.hostname !== 'billing.stripe.com') throw new Error('Unexpected portal address.');
  return url.href;
}
