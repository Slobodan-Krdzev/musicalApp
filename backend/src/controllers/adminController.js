import { User, Subscription } from '../models/index.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import {
  getEnhancedStats,
  adminSearch,
  listCustomers,
  listDealsAdmin,
  getNewsletterStats,
  listNewsletterSubscribers,
  listEventsAdmin,
  getEventAdminById,
  listApplicationsAdmin,
} from '../services/adminDashboardService.js';
import {
  listSupportTicketsAdmin,
  getSupportTicketAdmin,
  updateSupportTicketAdmin,
} from '../services/supportService.js';

export async function getStats(req, res, next) {
  try {
    const stats = await getEnhancedStats();
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
}

export async function search(req, res, next) {
  try {
    const { q = '', type = 'all', limit } = req.query;
    const results = await adminSearch(q, type, limit);
    res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
}

export async function getCustomers(req, res, next) {
  try {
    const { q, role, page, limit } = req.query;
    const data = await listCustomers({ q, role, page, limit });
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function getDeals(req, res, next) {
  try {
    const { q, status, page, limit } = req.query;
    const data = await listDealsAdmin({ q, status, page, limit });
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function getNewsletterStatsHandler(req, res, next) {
  try {
    const stats = await getNewsletterStats();
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
}

export async function getNewsletterSubscribers(req, res, next) {
  try {
    const { q, page, limit } = req.query;
    const data = await listNewsletterSubscribers({ q, page, limit });
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req, res, next) {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const data = await listCustomers({ q: '', role, page, limit });
    res.json({
      success: true,
      users: data.customers,
      pagination: data.pagination,
    });
  } catch (err) {
    next(err);
  }
}

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

export async function unsuspendUser(req, res, next) {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: false }, { new: true });
    if (!user) throw new NotFoundError('User not found');
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

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

export async function listEvents(req, res, next) {
  try {
    const { q, page, limit } = req.query;
    const data = await listEventsAdmin({ q, page, limit });
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function getEventAdmin(req, res, next) {
  try {
    const data = await getEventAdminById(req.params.id);
    if (!data) throw new NotFoundError('Event not found');
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function listApplications(req, res, next) {
  try {
    const { q, page, limit } = req.query;
    const data = await listApplicationsAdmin({ q, page, limit });
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function listSubscriptions(req, res, next) {
  try {
    const { q, page = 1, limit = 50 } = req.query;
    const filter = {};
    const regex = q && q.trim() ? new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;

    if (regex) {
      const users = await User.find({ email: regex }).select('_id').lean();
      filter.userId = { $in: users.map((u) => u._id) };
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter)
        .populate('userId', 'email role')
        .sort({ currentPeriodEnd: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Subscription.countDocuments(filter),
    ]);

    res.json({
      success: true,
      subscriptions,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
}

export async function listSupportTickets(req, res, next) {
  try {
    const { status, q, page, limit } = req.query;
    const data = await listSupportTicketsAdmin({ status, q, page, limit });
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function getSupportTicket(req, res, next) {
  try {
    const ticket = await getSupportTicketAdmin(req.params.id);
    res.json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
}

export async function updateSupportTicket(req, res, next) {
  try {
    const { status, adminNote } = req.validated;
    const ticket = await updateSupportTicketAdmin({
      ticketId: req.params.id,
      status,
      adminNote,
      adminId: req.user._id,
    });
    res.json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
}
