'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { StripeCardNumberElementOptions } from '@stripe/stripe-js';
import { Button } from '@/components/ui/Button';
import { getStripePromise } from '@/lib/stripe';
import { createSubscription, SUBSCRIPTION_PLANS, type PlanId } from '@/lib/subscription';

const ELEMENT_OPTIONS: StripeCardNumberElementOptions = {
  style: {
    base: {
      color: '#fafafa',
      fontFamily: 'inherit',
      fontSize: '15px',
      iconColor: '#a1a1aa',
      '::placeholder': { color: '#71717a' },
    },
    invalid: { color: '#f87171', iconColor: '#f87171' },
  },
};

const fieldShell =
  'rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3 transition-colors focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500/50';

/** Our own card form. Card fields are Stripe Elements; layout, labels and submit are ours. */
function CardForm({
  planId,
  clientSecret,
  onComplete,
}: {
  planId: PlanId;
  clientSecret: string;
  onComplete: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [name, setName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) return;

    setProcessing(true);
    setError(null);

    const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardNumber, billing_details: { name: name || undefined } },
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed. Please check your card details.');
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      onComplete();
      return;
    }

    // Any required next action (3DS) is handled by Stripe.js above; other states are unexpected.
    setError('Payment could not be completed. Please try again.');
    setProcessing(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="card-name" className="text-sm font-medium text-zinc-300">
          Name on card
        </label>
        <input
          id="card-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
          autoComplete="cc-name"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3 text-[15px] text-zinc-100 placeholder-zinc-600 transition-colors focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-300">Card number</label>
        <div className={fieldShell}>
          <CardNumberElement options={{ ...ELEMENT_OPTIONS, showIcon: true }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">Expiry</label>
          <div className={fieldShell}>
            <CardExpiryElement options={ELEMENT_OPTIONS} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">CVC</label>
          <div className={fieldShell}>
            <CardCvcElement options={ELEMENT_OPTIONS} />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" className="w-full" loading={processing} disabled={!stripe || processing}>
        {plan ? `Pay ${plan.price}${plan.cadence} & subscribe` : 'Pay & subscribe'}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-zinc-500">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 0h10.5a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H6.75a1.5 1.5 0 0 1-1.5-1.5v-6a1.5 1.5 0 0 1 1.5-1.5Z" />
        </svg>
        Payments are securely processed by Stripe.
      </p>
    </form>
  );
}

type LoadState = 'loading' | 'ready' | 'error';

/**
 * Inline subscription payment: creates the subscription (incomplete) to obtain a PaymentIntent
 * client secret, then renders our custom card form to confirm it. No redirect, no Stripe-hosted UI.
 */
export function InlineCheckout({
  planId,
  onComplete,
}: {
  planId: PlanId;
  onComplete: (sessionId: string | null) => void;
}) {
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const stripePromise = useMemo(() => getStripePromise(), []);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    setError(null);
    setClientSecret(null);

    (async () => {
      try {
        const stripe = await stripePromise;
        if (!stripe) throw new Error('Could not load Stripe. Check your publishable key and network.');
        const { clientSecret: secret } = await createSubscription(planId);
        if (cancelled) return;
        setClientSecret(secret);
        setState('ready');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not start payment');
        setState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [planId, stripePromise]);

  if (state === 'error') {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
    );
  }

  if (state === 'loading' || !clientSecret) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/40">
        <span className="inline-flex items-center gap-2 text-sm text-zinc-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
          Preparing secure payment…
        </span>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ locale: 'en' }}>
      <CardForm planId={planId} clientSecret={clientSecret} onComplete={() => onComplete(null)} />
    </Elements>
  );
}
