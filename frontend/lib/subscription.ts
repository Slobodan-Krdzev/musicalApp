import { apiRequest } from '@/lib/api';

export type PlanId = 'pro' | 'premium';

export type SubscriptionPlan = {
  id: PlanId;
  name: string;
  price: string;
  cadence: string;
  highlight?: boolean;
  badge?: string;
  features: string[];
};

/**
 * Plan catalogue shown in the renewal prompt and the subscription panel.
 * Internal ids (`pro` / `premium`) map to STRIPE_PRICE_PRO / STRIPE_PRICE_PREMIUM on the backend.
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'pro',
    name: 'Monthly',
    price: '$9.99',
    cadence: '/mo',
    features: ['Unlimited booking requests', 'Profile visibility boost', 'Advanced analytics'],
  },
  {
    id: 'premium',
    name: 'Yearly',
    price: '$99.99',
    cadence: '/yr',
    highlight: true,
    badge: 'Best value',
    features: ['Save ~17% vs monthly', 'All features included', 'Featured status'],
  },
];

export type Subscription = {
  planId: string;
  status: string;
  currentPeriodEnd?: string;
  trialEnd?: string;
  cancelAtPeriodEnd?: boolean;
  hasAccess?: boolean;
  isExpired?: boolean;
};

/**
 * Create a subscription for a plan and return the PaymentIntent client secret.
 * The client secret is confirmed by our custom inline card form via Stripe.js.
 */
export async function createSubscription(
  planId: PlanId
): Promise<{ clientSecret: string; subscriptionId: string }> {
  const { clientSecret, subscriptionId } = await apiRequest<{ clientSecret: string; subscriptionId: string }>(
    '/api/stripe/create-subscription',
    {
      method: 'POST',
      body: JSON.stringify({ planId }),
    }
  );
  if (!clientSecret) throw new Error('Could not start payment');
  return { clientSecret, subscriptionId };
}

/**
 * After the inline payment succeeds, pull the latest subscription state from Stripe into the DB.
 * This makes the UI update immediately without waiting for the webhook.
 */
export async function syncSubscription(): Promise<Subscription | null> {
  const { subscription } = await apiRequest<{ subscription: Subscription | null }>('/api/stripe/sync', {
    method: 'POST',
  });
  return subscription;
}

export type Invoice = {
  id: string;
  number: string | null;
  status: string | null;
  amount: number;
  currency: string;
  created: string | null;
  periodEnd: string | null;
  hostedInvoiceUrl: string | null;
  pdfUrl: string | null;
};

/**
 * Fetch the user's recent invoices to render the inline billing history table.
 */
export async function fetchInvoices(): Promise<Invoice[]> {
  const { invoices } = await apiRequest<{ invoices: Invoice[] }>('/api/stripe/invoices');
  return invoices ?? [];
}

/**
 * Cancel the subscription at the end of the current period (no redirect, via Stripe API).
 * The user keeps access until the period ends; auto-renew is turned off.
 */
export async function cancelSubscription(): Promise<Subscription | null> {
  const { subscription } = await apiRequest<{ subscription: Subscription | null }>('/api/stripe/cancel', {
    method: 'POST',
  });
  return subscription;
}

/**
 * Undo a scheduled cancellation so the subscription keeps auto-renewing.
 */
export async function resumeSubscription(): Promise<Subscription | null> {
  const { subscription } = await apiRequest<{ subscription: Subscription | null }>('/api/stripe/resume', {
    method: 'POST',
  });
  return subscription;
}

/**
 * Open the Stripe Billing Portal so the user can update payment methods, cancel, or resume.
 */
export async function openBillingPortal(): Promise<void> {
  const { url } = await apiRequest<{ url: string }>('/api/stripe/create-portal', {
    method: 'POST',
  });
  if (!url) throw new Error('Could not open billing portal');
  window.location.assign(url);
}
