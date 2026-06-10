import { User, Subscription, PLAN_IDS } from '../models/index.js';
import { ROLES } from '../models/User.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import { stripe, isStripeConfigured } from './stripeService.js';
import { notifyFreePassGranted, notifyFreePassRevoked } from './subscriptionNotifications.js';

function parseEndDate(endDate) {
  let end;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(endDate).trim())) {
    end = new Date(`${String(endDate).trim()}T23:59:59.999`);
  } else {
    end = new Date(endDate);
  }
  if (Number.isNaN(end.getTime())) {
    throw new ValidationError('Invalid end date');
  }
  const startOfTomorrow = new Date();
  startOfTomorrow.setHours(0, 0, 0, 0);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  if (end < startOfTomorrow) {
    throw new ValidationError('End date must be at least tomorrow');
  }
  return end;
}

/**
 * Grant a user complimentary access until a fixed date (Free Pass).
 * Cancels any active Stripe subscription immediately so billing stops.
 */
export async function grantFreePass({ userId, adminId, endDate, note }) {
  const user = await User.findById(userId).select('email role');
  if (!user) throw new NotFoundError('User not found');
  if (user.role === ROLES.SUPERADMIN) {
    throw new ForbiddenError('Cannot grant a Free Pass to an admin account');
  }

  const end = parseEndDate(endDate);
  const trimmedNote = note?.trim() || null;

  const existing = await Subscription.findOne({ userId });
  let stripeCanceled = false;

  if (existing?.stripeSubscriptionId) {
    if (!isStripeConfigured()) {
      throw new ValidationError('Stripe is not configured — cannot cancel an active paid subscription');
    }
    try {
      await stripe.subscriptions.cancel(existing.stripeSubscriptionId);
      stripeCanceled = true;
    } catch (err) {
      throw new ValidationError(`Could not cancel Stripe subscription: ${err.message}`);
    }
  }

  const sub = await Subscription.findOneAndUpdate(
    { userId },
    {
      userId,
      planId: PLAN_IDS.FREE_PASS,
      status: 'active',
      currentPeriodEnd: end,
      freePassActive: true,
      grantedByAdmin: true,
      adminGrantedBy: adminId,
      adminGrantedAt: new Date(),
      adminRevokedBy: null,
      adminNote: trimmedNote,
      stripeSubscriptionId: null,
      cancelAtPeriodEnd: false,
      trialEnd: null,
      expiringNotifiedAt: null,
      expiredNotifiedAt: null,
      reminder7SentAt: null,
      reminder1SentAt: null,
    },
    { upsert: true, new: true }
  );

  try {
    await notifyFreePassGranted(sub, { stripeCanceled, note: trimmedNote });
  } catch (err) {
    console.error('[adminFreePassService] grant notify failed:', err.message);
  }

  return sub;
}

/**
 * Revoke an active Free Pass early. Only admins can do this.
 */
export async function revokeFreePass({ userId, adminId, note }) {
  const sub = await Subscription.findOne({ userId });
  if (!sub?.freePassActive) {
    throw new NotFoundError('No active Free Pass for this user');
  }

  const revokeNote = note?.trim() || null;

  const updated = await Subscription.findOneAndUpdate(
    { userId },
    {
      status: 'canceled',
      freePassActive: false,
      grantedByAdmin: false,
      adminRevokedBy: adminId,
    },
    { new: true }
  );

  try {
    await notifyFreePassRevoked(updated, { note: revokeNote, grantNote: sub.adminNote });
  } catch (err) {
    console.error('[adminFreePassService] revoke notify failed:', err.message);
  }

  return updated;
}
