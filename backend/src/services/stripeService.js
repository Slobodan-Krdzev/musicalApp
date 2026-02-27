import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_PRICE_PRO, STRIPE_PRICE_PREMIUM, FRONTEND_URL } from '../config/env.js';
import { Subscription, PLAN_IDS } from '../models/index.js';

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' }) : null;

/**
 * Create or get Stripe customer and create Checkout session for subscription.
 */
export async function createCheckoutSession(userId, userEmail, priceId, successPath = '/dashboard', cancelPath = '/dashboard') {
  if (!stripe) throw new Error('Stripe is not configured');
  const customer = await stripe.customers.create({ email: userEmail });
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    client_reference_id: userId.toString(),
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${FRONTEND_URL}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${FRONTEND_URL}${cancelPath}`,
    subscription_data: {
      trial_period_days: priceId === null ? 14 : undefined,
    },
    metadata: { userId: userId.toString() },
  });
  return { url: session.url, sessionId: session.id };
}

/**
 * Create session for Free Trial (no Stripe payment, we create local subscription).
 */
export async function createFreeTrialCheckout(userId) {
  return { url: `${FRONTEND_URL}/dashboard?trial=1`, sessionId: 'free_trial' };
}

/**
 * Get price ID for plan.
 */
export function getPriceIdForPlan(planId) {
  if (planId === PLAN_IDS.FREE_TRIAL) return null;
  if (planId === PLAN_IDS.PRO) return STRIPE_PRICE_PRO;
  if (planId === PLAN_IDS.PREMIUM) return STRIPE_PRICE_PREMIUM;
  return null;
}

/**
 * Handle Stripe webhook events: subscription created/updated/deleted.
 */
export async function handleWebhookEvent(event) {
  if (!stripe) return;
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const userId = sub.metadata?.userId;
      if (!userId) break;
      const planId = sub.items?.data?.[0]?.price?.id === STRIPE_PRICE_PREMIUM ? PLAN_IDS.PREMIUM : PLAN_IDS.PRO;
      await Subscription.findOneAndUpdate(
        { userId },
        {
          userId,
          planId,
          stripeCustomerId: sub.customer,
          stripeSubscriptionId: sub.id,
          status: sub.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
        { upsert: true, new: true }
      );
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: sub.id },
        { status: 'canceled', stripeSubscriptionId: null }
      );
      break;
    }
    default:
      break;
  }
}

export { stripe };
