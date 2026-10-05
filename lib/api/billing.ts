import { request } from './client';

export type TestPlan = 'single' | 'bundle' | 'cv_download';
export interface BillingConfig {
  mode: 'disabled' | 'test';
  live_payments: false;
  launch_free: boolean;
  premium_available: false;
  plans: Array<{ id: TestPlan; name: string; amount: number; currency: string }>;
}
export interface BillingOrder {
  id: string;
  plan: TestPlan;
  resource_id: number;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'expired' | 'refunded' | 'partially_refunded';
  is_test: boolean;
  checkout_url: string | null;
  refunded_amount: number;
  fulfillment: 'test_only_no_live_access';
}
export const billingApi = {
  config: () => request<BillingConfig>('/api/billing/config/'),
  checkout: (plan: TestPlan, resourceId: number, requestKey: string) => request<BillingOrder>('/api/billing/checkout/', {
    method: 'POST', body: { plan, resource_id: resourceId, request_key: requestKey },
  }),
  order: (id: string) => request<BillingOrder>(`/api/billing/orders/${encodeURIComponent(id)}/`),
};

export function checkoutDestination(order: BillingOrder): string {
  if (!order.is_test || order.fulfillment !== 'test_only_no_live_access') throw new Error('Unexpected payment mode.');
  if (order.status !== 'pending') return `/billing/return?order=${encodeURIComponent(order.id)}`;
  const url = new URL(order.checkout_url ?? '');
  if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com' || url.username || url.password) throw new Error('Unexpected checkout address.');
  return url.href;
}
