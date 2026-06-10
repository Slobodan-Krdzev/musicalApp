import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_PRICE_PRO, STRIPE_PRICE_PREMIUM, FRONTEND_URL } from '../config/env.js';
import { Subscription, PLAN_IDS } from '../models/index.js';
import {
  notifySubscriptionStarted,
  notifyRenewed,
  notifyCanceled,
} from './subscriptionNotifications.js';

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' }) : null;

export function isStripeConfigured() {
  return !!stripe;
}

/**
 * Reuse the Stripe customer stored on the user's subscription, or create one and persist it.
 * Reusing avoids orphan customers and keeps the billing portal / payment methods consistent.
 */
async function getOrCreateCustomer(userId, userEmail) {
  const existing = await Subscription.findOne({ userId }).select('stripeCustomerId');
  if (existing?.stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(existing.stripeCustomerId);
      if (customer && !customer.deleted) return customer.id;
    } catch {
      // Customer no longer exists in Stripe — fall through and create a fresh one.
    }
  }

  const customer = await stripe.customers.create({
    email: userEmail,
    metadata: { userId: userId.toString() },
  });

  await Subscription.findOneAndUpdate(
    { userId },
    { userId, stripeCustomerId: customer.id },
    { upsert: true, setDefaultsOnInsert: false }
  );

  return customer.id;
}

/**
 * Create a subscription with a custom (inline) payment form.
 *
 * Uses `payment_behavior: 'default_incomplete'` so Stripe creates the subscription in an
 * `incomplete` state and returns a PaymentIntent. The browser confirms that PaymentIntent
 * with our own card form via Stripe.js; the `customer.subscription.*` webhooks then activate
 * the local record. Any prior unpaid/incomplete subscription for the customer is cleaned up
 * first so we don't stack duplicate Stripe subscriptions on retries.
 */
export async function createSubscription(userId, userEmail, priceId) {
  if (!stripe) throw new Error('Stripe is not configured');

  const localCheck = await Subscription.findOne({ userId });
  if (localCheck?.freePassActive && localCheck.isCurrentlyActive()) {
    const end = localCheck.currentPeriodEnd
      ? localCheck.currentPeriodEnd.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
      : 'the end of your pass';
    throw new Error(`You have an active Free Pass until ${end}.`);
  }

  const customerId = await getOrCreateCustomer(userId, userEmail);

  // Ensure exactly one subscription per customer: cancel any existing ones (incomplete from
  // abandoned attempts, or active/past_due) before creating a new one. Prevents duplicate billing.
  const existing = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 20,
  });
  for (const s of existing.data) {
    if (s.status === 'canceled') continue;
    try {
      await stripe.subscriptions.cancel(s.id);
    } catch {
      // best-effort cleanup
    }
  }

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    metadata: { userId: userId.toString() },
  });

  const paymentIntent = subscription.latest_invoice?.payment_intent;
  if (!paymentIntent?.client_secret) {
    throw new Error('Could not initialize payment for this subscription');
  }

  return {
    subscriptionId: subscription.id,
    clientSecret: paymentIntent.client_secret,
  };
}

/**
 * Pull the latest subscription state from Stripe and upsert the local record.
 * Used right after the inline payment so the UI reflects the new status immediately, without
 * waiting for the webhook (essential in local dev where webhooks may not be forwarded).
 */
export async function syncSubscriptionFromStripe(userId) {
  if (!stripe) throw new Error('Stripe is not configured');

  const local = await Subscription.findOne({ userId }).select('stripeCustomerId freePassActive currentPeriodEnd status');
  if (local?.freePassActive && local.isCurrentlyActive()) {
    return local;
  }

  const customerId = local?.stripeCustomerId;
  if (!customerId) return null;

  const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20 });
  if (!subs.data.length) return null;

  // Prefer a currently-usable subscription; otherwise the most recently created one.
  const usable = subs.data.find((s) => ['active', 'trialing', 'past_due'].includes(s.status));
  const chosen = usable || subs.data.sort((a, b) => b.created - a.created)[0];

  await upsertFromStripeSubscription(chosen);
  return Subscription.findOne({ userId });
}

/**
 * List the user's recent invoices from Stripe for the inline billing history table.
 * Returns a lightweight, UI-friendly shape (no raw Stripe objects).
 */
export async function listInvoices(userId, limit = 12) {
  if (!stripe) throw new Error('Stripe is not configured');

  const local = await Subscription.findOne({ userId }).select('stripeCustomerId');
  const customerId = local?.stripeCustomerId;
  if (!customerId) return [];

  const invoices = await stripe.invoices.list({ customer: customerId, limit });

  return invoices.data
    .filter((inv) => inv.total != null)
    .map((inv) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amount: inv.total,
      currency: inv.currency,
      created: inv.created ? new Date(inv.created * 1000).toISOString() : null,
      periodEnd: inv.period_end ? new Date(inv.period_end * 1000).toISOString() : null,
      hostedInvoiceUrl: inv.hosted_invoice_url || null,
      pdfUrl: inv.invoice_pdf || null,
    }));
}

/**
 * Create a Stripe Billing Portal session so the user can update payment methods,
 * cancel, or resume their subscription.
 */
export async function createBillingPortalSession(userId, returnPath = '/dashboard') {
  if (!stripe) throw new Error('Stripe is not configured');

  await assertNotOnActiveFreePass(userId);

  const sub = await Subscription.findOne({ userId }).select('stripeCustomerId');
  if (!sub?.stripeCustomerId) {
    throw new Error('No Stripe customer for this user');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${FRONTEND_URL}${returnPath}`,
  });

  return { url: session.url };
}

async function assertNotOnActiveFreePass(userId) {
  const local = await Subscription.findOne({ userId });
  if (local?.freePassActive && local.isCurrentlyActive()) {
    throw new Error('Your account is on a Free Pass. Billing changes are managed by the administrator.');
  }
}

/**
 * Cancel the user's subscription at the end of the current period. The user keeps access
 * until then, and Stripe stops auto-renewing. Returns the updated local subscription.
 */
export async function cancelSubscription(userId) {
  if (!stripe) throw new Error('Stripe is not configured');

  await assertNotOnActiveFreePass(userId);

  const local = await Subscription.findOne({ userId }).select('stripeSubscriptionId');
  if (!local?.stripeSubscriptionId) throw new Error('No active subscription to cancel');

  const updated = await stripe.subscriptions.update(local.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
  await upsertFromStripeSubscription(updated);
  const sub = await Subscription.findOne({ userId });
  try {
    if (sub) await notifyCanceled(sub);
  } catch (err) {
    console.error('[stripeService] cancellation notify failed:', err.message);
  }
  return sub;
}

/**
 * Undo a scheduled cancellation so the subscription keeps auto-renewing.
 */
export async function resumeSubscription(userId) {
  if (!stripe) throw new Error('Stripe is not configured');

  await assertNotOnActiveFreePass(userId);

  const local = await Subscription.findOne({ userId }).select('stripeSubscriptionId');
  if (!local?.stripeSubscriptionId) throw new Error('No subscription to resume');

  const updated = await stripe.subscriptions.update(local.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });
  await upsertFromStripeSubscription(updated);
  return Subscription.findOne({ userId });
}

/**
 * Map a Stripe Price ID to our internal plan identifier.
 */
export function getPriceIdForPlan(planId) {
  if (planId === PLAN_IDS.PRO) return STRIPE_PRICE_PRO;
  if (planId === PLAN_IDS.PREMIUM) return STRIPE_PRICE_PREMIUM;
  return null;
}

function planFromPriceId(priceId) {
  if (priceId === STRIPE_PRICE_PREMIUM) return PLAN_IDS.PREMIUM;
  return PLAN_IDS.PRO;
}

/**
 * Persist a Stripe subscription object into our DB (used by created/updated webhooks).
 */
async function upsertFromStripeSubscription(sub) {
  const userId = sub.metadata?.userId;
  const filter = userId ? { userId } : { stripeSubscriptionId: sub.id };

  const lookup = userId ? { userId } : { stripeSubscriptionId: sub.id };
  const existing = await Subscription.findOne(lookup).select('freePassActive');
  if (existing?.freePassActive) return existing;

  const priceId = sub.items?.data?.[0]?.price?.id;
  const update = {
    planId: planFromPriceId(priceId),
    stripeCustomerId: sub.customer,
    stripeSubscriptionId: sub.id,
    status: sub.status,
    currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
    trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
  };
  if (userId) update.userId = userId;

  // A new active period clears prior reminder bookkeeping so future expiry notifies again.
  if (sub.status === 'active' || sub.status === 'trialing') {
    update.expiringNotifiedAt = null;
    update.expiredNotifiedAt = null;
    update.reminder7SentAt = null;
    update.reminder1SentAt = null;
  }

  const saved = await Subscription.findOneAndUpdate(filter, update, { upsert: !!userId, new: true });

  // Send the "subscription active" email exactly once, on first activation.
  if (saved && (sub.status === 'active' || sub.status === 'trialing') && !saved.welcomeNotifiedAt) {
    try {
      await notifySubscriptionStarted(saved);
      await Subscription.updateOne({ _id: saved._id }, { welcomeNotifiedAt: new Date() });
    } catch (err) {
      console.error('[stripeService] subscription-started notify failed:', err.message);
    }
  }

  return saved;
}

/**
 * Handle Stripe webhook events: subscription created/updated/deleted.
 */
export async function handleWebhookEvent(event) {
  if (!stripe) return;
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      await upsertFromStripeSubscription(event.data.object);
      break;
    }
    case 'invoice.paid': {
      // Renewals (subscription_cycle) trigger a "renewed" email. The first invoice
      // (subscription_create) is covered by the activation email, so it's skipped here.
      const invoice = event.data.object;
      if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
        try {
          const subObj = await stripe.subscriptions.retrieve(invoice.subscription);
          await upsertFromStripeSubscription(subObj);
          const local = await Subscription.findOne({ stripeSubscriptionId: invoice.subscription });
          if (local) await notifyRenewed(local);
        } catch (err) {
          console.error('[stripeService] renewal notify failed:', err.message);
        }
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const local = await Subscription.findOne({ stripeSubscriptionId: sub.id }).select('freePassActive');
      if (local?.freePassActive) {
        await Subscription.updateOne({ _id: local._id }, { stripeSubscriptionId: null });
        break;
      }
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: sub.id },
        { status: 'canceled', cancelAtPeriodEnd: false }
      );
      break;
    }
    default:
      break;
  }
}

export { stripe };
