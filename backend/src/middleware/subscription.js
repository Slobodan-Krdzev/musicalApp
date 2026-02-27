import { Subscription } from '../models/index.js';
import { SubscriptionRequiredError } from '../utils/errors.js';

/**
 * Block access if user does not have an active subscription (active or trialing).
 * Use after authenticate + requireRoles where needed.
 * Free trial is stored as planId 'free_trial' with status 'trialing'.
 */
export async function requireActiveSubscription(req, res, next) {
  try {
    if (!req.user) return next(new SubscriptionRequiredError('Authentication required'));
    const sub = await Subscription.findOne({ userId: req.user._id });
    const hasAccess =
      sub &&
      (sub.status === 'active' || sub.status === 'trialing') &&
      (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) > new Date());
    if (!hasAccess) {
      return next(new SubscriptionRequiredError('Active subscription required to use this feature'));
    }
    req.subscription = sub;
    next();
  } catch (err) {
    next(err);
  }
}
