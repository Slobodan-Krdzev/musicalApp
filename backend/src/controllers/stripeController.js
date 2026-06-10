import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, FRONTEND_URL } from '../config/env.js';
import { Subscription, PLAN_IDS } from '../models/index.js';
import {
  getPriceIdForPlan,
  createSubscription,
  syncSubscriptionFromStripe,
  cancelSubscription,
  resumeSubscription,
  listInvoices,
  createBillingPortalSession,
  handleWebhookEvent,
  isStripeConfigured,
} from '../services/stripeService.js';
import { ValidationError } from '../utils/errors.js';

const TRIAL_DAYS = 14;

/**
 * Public Stripe config for the browser (publishable key only — safe to expose).
 */
export function getStripeConfig(req, res) {
  res.json({ success: true, publishableKey: STRIPE_PUBLISHABLE_KEY, enabled: !!STRIPE_SECRET_KEY });
}

/**
 * Create a subscription for a plan (Pro or Premium) and return the PaymentIntent client secret.
 * The browser confirms payment with our custom inline card form. Used for first signup and renewal.
 */
export async function createSubscriptionCheckout(req, res, next) {
  try {
    const { planId } = req.body;
    if (!planId || !['pro', 'premium'].includes(planId)) {
      throw new ValidationError('Invalid plan. Use pro or premium.');
    }
    if (!isStripeConfigured()) {
      throw new ValidationError('Payments are not configured. Please contact support.');
    }
    const priceId = getPriceIdForPlan(planId);
    if (!priceId) throw new ValidationError('Stripe price not configured for this plan');

    const { clientSecret, subscriptionId } = await createSubscription(
      req.user._id,
      req.user.email,
      priceId
    );
    res.json({ success: true, clientSecret, subscriptionId });
  } catch (err) {
    if (err.message?.includes('Free Pass')) {
      return next(new ValidationError(err.message));
    }
    next(err);
  }
}

/**
 * Sync the user's subscription from Stripe into the DB and return the latest state.
 * Called after the inline payment completes so the UI updates without waiting for the webhook.
 */
export async function syncSubscription(req, res, next) {
  try {
    if (!isStripeConfigured()) {
      throw new ValidationError('Payments are not configured. Please contact support.');
    }
    const sub = await syncSubscriptionFromStripe(req.user._id);
    if (!sub) return res.json({ success: true, subscription: null });
    res.json({ success: true, subscription: { ...sub.toObject(), ...sub.getAccessState() } });
  } catch (err) {
    next(err);
  }
}

/**
 * Cancel the user's subscription at period end (keeps access until then, stops auto-renew).
 */
export async function cancelMySubscription(req, res, next) {
  try {
    if (!isStripeConfigured()) {
      throw new ValidationError('Payments are not configured. Please contact support.');
    }
    const sub = await cancelSubscription(req.user._id);
    res.json({ success: true, subscription: sub ? { ...sub.toObject(), ...sub.getAccessState() } : null });
  } catch (err) {
    if (err.message === 'No active subscription to cancel') {
      return next(new ValidationError('You don’t have an active subscription to cancel.'));
    }
    next(err);
  }
}

/**
 * Undo a scheduled cancellation so the subscription keeps auto-renewing.
 */
export async function resumeMySubscription(req, res, next) {
  try {
    if (!isStripeConfigured()) {
      throw new ValidationError('Payments are not configured. Please contact support.');
    }
    const sub = await resumeSubscription(req.user._id);
    res.json({ success: true, subscription: sub ? { ...sub.toObject(), ...sub.getAccessState() } : null });
  } catch (err) {
    if (err.message === 'No subscription to resume') {
      return next(new ValidationError('You don’t have a subscription to resume.'));
    }
    next(err);
  }
}

/**
 * Return the user's recent invoices for the inline billing history table.
 */
export async function getInvoices(req, res, next) {
  try {
    if (!isStripeConfigured()) return res.json({ success: true, invoices: [] });
    const invoices = await listInvoices(req.user._id);
    res.json({ success: true, invoices });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a Stripe Billing Portal session so the user can manage/renew an existing subscription.
 */
export async function createPortal(req, res, next) {
  try {
    if (!isStripeConfigured()) {
      throw new ValidationError('Payments are not configured. Please contact support.');
    }
    const { url } = await createBillingPortalSession(req.user._id, '/dashboard');
    res.json({ success: true, url });
  } catch (err) {
    if (err.message === 'No Stripe customer for this user') {
      return next(new ValidationError('No billing account yet. Choose a plan to subscribe first.'));
    }
    next(err);
  }
}

/**
 * Start free trial (no Stripe). Create/update subscription with trial end date.
 */
export async function createCheckoutFreeTrial(req, res, next) {
  try {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
    await Subscription.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        planId: PLAN_IDS.FREE_TRIAL,
        status: 'trialing',
        trialEnd,
        currentPeriodEnd: trialEnd,
        expiringNotifiedAt: null,
        expiredNotifiedAt: null,
      },
      { upsert: true, new: true }
    );
    res.json({
      success: true,
      url: `${FRONTEND_URL}/dashboard?trial=1`,
      message: 'Free trial started',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Stripe webhook: verify signature and handle events.
 */
export async function webhook(req, res, next) {
  try {
    if (!STRIPE_WEBHOOK_SECRET || !STRIPE_SECRET_KEY) {
      return res.status(501).send('Webhook not configured');
    }
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = Stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (e) {
      return res.status(400).send(`Webhook Error: ${e.message}`);
    }
    await handleWebhookEvent(event);
    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}
