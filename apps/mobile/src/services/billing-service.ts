import { apiFetch } from './api-client';

export type PlanId = 'pro' | 'office';
export type BillingCycle = 'monthly' | 'annual';

export function createCheckoutSession(plan: PlanId, cycle: BillingCycle): Promise<{ url: string }> {
  return apiFetch<{ url: string }>('/billing/checkout', { method: 'POST', body: JSON.stringify({ plan, cycle }) });
}
