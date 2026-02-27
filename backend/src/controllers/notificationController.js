import { Notification } from '../models/index.js';

/**
 * List notifications for current user (paginated).
 */
export async function getMyNotifications(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const unreadOnly = req.query.unread === 'true';

    const filter = { userId: req.user._id };
    if (unreadOnly) filter.isRead = false;

    const [notifications, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Notification.countDocuments(filter),
    ]);

    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Mark one notification as read.
 */
export async function markRead(req, res, next) {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * Mark all notifications as read.
 */
export async function markAllRead(req, res, next) {
  try {
    await Notification.updateMany({ userId: req.user._id }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
