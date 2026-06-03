import { Subscription } from '../models/index.js';
import { notifyExpiringReminder, notifyExpired } from './subscriptionNotifications.js';

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Send a staged pre-expiry reminder (7 days, then 1 day before period end) once per period.
 * `flagField` marks the reminder as sent so it isn't repeated; the flag is cleared by the
 * Stripe upsert whenever a new active period begins.
 */
async function sendStagedReminder(now, days, flagField) {
  const windowEnd = new Date(now.getTime() + days * DAY_MS);

  const due = await Subscription.find({
    status: { $in: ['active', 'trialing'] },
    currentPeriodEnd: { $gt: now, $lte: windowEnd },
    [flagField]: null,
  }).lean();

  for (const sub of due) {
    try {
      await notifyExpiringReminder(sub, days);
      await Subscription.updateOne({ _id: sub._id }, { [flagField]: now });
    } catch (err) {
      console.error(`[SubscriptionScheduler] ${days}-day reminder failed for ${sub._id}:`, err.message);
    }
  }
}

/**
 * Expire lapsed local subscriptions (free trials and any non-Stripe records whose period ended)
 * and send a one-time "ended — please renew" prompt. Stripe-managed subscriptions are reconciled
 * by webhooks, but we still send the renewal prompt once their period has clearly passed.
 */
async function handleEnded(now) {
  const ended = await Subscription.find({
    currentPeriodEnd: { $lte: now },
    $or: [
      { status: { $in: ['active', 'trialing'] } },
      { status: { $in: ['past_due', 'canceled'] }, expiredNotifiedAt: null },
    ],
  }).lean();

  for (const sub of ended) {
    try {
      // Locally-managed (no Stripe subscription) records are flipped to canceled on expiry.
      if (!sub.stripeSubscriptionId && (sub.status === 'active' || sub.status === 'trialing')) {
        await Subscription.updateOne({ _id: sub._id }, { status: 'canceled' });
      }

      if (sub.expiredNotifiedAt) continue;

      await notifyExpired(sub);
      await Subscription.updateOne({ _id: sub._id }, { expiredNotifiedAt: now });
    } catch (err) {
      console.error(`[SubscriptionScheduler] ended notify failed for ${sub._id}:`, err.message);
    }
  }
}

async function runOnce() {
  const now = new Date();
  // Order matters: 1-day window is a subset of the 7-day window, so send the 7-day reminder
  // first (it will already be flagged by the time only 1 day remains).
  await sendStagedReminder(now, 7, 'reminder7SentAt');
  await sendStagedReminder(now, 1, 'reminder1SentAt');
  await handleEnded(now);
}

let intervalId = null;

export function startSubscriptionScheduler() {
  console.log(`[SubscriptionScheduler] started (every ${CHECK_INTERVAL_MS / 1000}s)`);
  runOnce().catch(console.error);
  intervalId = setInterval(() => {
    runOnce().catch(console.error);
  }, CHECK_INTERVAL_MS);
}

export function stopSubscriptionScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
