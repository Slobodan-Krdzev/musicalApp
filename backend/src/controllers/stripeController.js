import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, FRONTEND_URL } from '../config/env.js';
import { Subscription, PLAN_IDS } from '../models/index.js';
import { getPriceIdForPlan, createCheckoutSession, createFreeTrialCheckout, handleWebhookEvent } from '../services/stripeService.js';
import { ValidationError } from '../utils/errors.js';

const TRIAL_DAYS = 14;

/**
 * Create Stripe Checkout session for a plan (Pro or Premium).
 * Free Trial is handled by createCheckoutFreeTrial.
 */
export async function createCheckout(req, res, next) {
  try {
    const { planId } = req.body;
    if (!planId || !['pro', 'premium'].includes(planId)) {
      throw new ValidationError('Invalid plan. Use pro or premium.');
    }
    const priceId = getPriceIdForPlan(planId);
    if (!priceId) throw new ValidationError('Stripe price not configured for this plan');

    const { url, sessionId } = await createCheckoutSession(
      req.user._id,
      req.user.email,
      priceId,
      '/dashboard',
      '/dashboard'
    );
    res.json({ success: true, url, sessionId });
  } catch (err) {
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
