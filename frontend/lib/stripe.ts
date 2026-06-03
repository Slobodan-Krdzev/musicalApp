import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { apiRequest } from '@/lib/api';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Lazily load Stripe.js using the publishable key served by the backend.
 * Memoized so Stripe.js is fetched and initialized only once per page.
 */
export function getStripePromise(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = apiRequest<{ publishableKey: string }>('/api/stripe/config')
      .then(({ publishableKey }) => (publishableKey ? loadStripe(publishableKey) : null))
      .catch(() => null);
  }
  return stripePromise;
}
