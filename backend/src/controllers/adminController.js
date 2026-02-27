import { User, Event, Application, Deal, Subscription, ROLES } from '../models/index.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

/**
 * Dashboard stats (superadmin only).
 */
export async function getStats(req, res, next) {
  try {
    const [totalUsers, musicians, venues, subscriptions, events, applications, deals] = await Promise.all([
      User.countDocuments({ isSuspended: false }),
      User.countDocuments({ role: ROLES.MUSICIAN, isSuspended: false }),
      User.countDocuments({ role: ROLES.VENUE, isSuspended: false }),
      Subscription.countDocuments({ status: { $in: ['active', 'trialing'] } }),
      Event.countDocuments(),
      Application.countDocuments(),
      Deal.countDocuments(),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        musicians,
        venues,
        activeSubscriptions: subscriptions,
        events,
        applications,
        deals,
        revenue: null, // can be aggregated from Stripe if needed
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * List users with optional role filter.
 */
export async function listUsers(req, res, next) {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-password -refreshToken').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(filter),
    ]);
    res.json({
      success: true,
      users,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Suspend user.
 */
export async function suspendUser(req, res, next) {
  try {
    const { id } = req.params;
    if (id === req.user._id.toString()) throw new ForbiddenError('Cannot suspend yourself');
    const user = await User.findByIdAndUpdate(id, { isSuspended: true }, { new: true });
    if (!user) throw new NotFoundError('User not found');
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

/**
 * Unsuspend user.
 */
export async function unsuspendUser(req, res, next) {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: false }, { new: true });
    if (!user) throw new NotFoundError('User not found');
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

/**
 * Manually cancel subscription (set to canceled, clear Stripe refs if any).
 */
export async function cancelSubscription(req, res, next) {
  try {
    const { userId } = req.params;
    const sub = await Subscription.findOneAndUpdate(
      { userId },
      { status: 'canceled', stripeSubscriptionId: null, cancelAtPeriodEnd: false },
      { new: true }
    );
    if (!sub) throw new NotFoundError('Subscription not found');
    res.json({ success: true, subscription: sub });
  } catch (err) {
    next(err);
  }
}

/**
 * List events (admin view).
 */
export async function listEvents(req, res, next) {
  try {
    const events = await Event.find().populate('venueId', 'email').sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, events });
  } catch (err) {
    next(err);
  }
}

/**
 * List applications (admin).
 */
export async function listApplications(req, res, next) {
  try {
    const applications = await Application.find()
      .populate('eventId')
      .populate('musicianId', 'email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ success: true, applications });
  } catch (err) {
    next(err);
  }
}

/**
 * List deals (admin).
 */
export async function listDeals(req, res, next) {
  try {
    const deals = await Deal.find()
      .populate('eventId')
      .populate('musicianId', 'email')
      .populate('venueId', 'email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ success: true, deals });
  } catch (err) {
    next(err);
  }
}

/**
 * List subscriptions (admin).
 */
export async function listSubscriptions(req, res, next) {
  try {
    const subs = await Subscription.find()
      .populate('userId', 'email role')
      .sort({ currentPeriodEnd: -1 })
      .lean();
    res.json({ success: true, subscriptions: subs });
  } catch (err) {
    next(err);
  }
}
