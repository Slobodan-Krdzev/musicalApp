import { Event, VenueProfile, User, Application, Subscription } from '../models/index.js';
import { NotFoundError, SubscriptionRequiredError } from '../utils/errors.js';
import { matchAndNotifyMusicians } from '../services/eventMatchingService.js';

/**
 * List events (public) with filters and pagination.
 */
export async function listEvents(req, res, next) {
  try {
    const { genre, dateFrom, dateTo, page = 1, limit = 12 } = req.validated ?? {};
    const filter = { status: 'OPEN' };
    if (genre) filter.genre = { $in: [genre] };
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = dateFrom;
      if (dateTo) filter.date.$lte = dateTo;
    }

    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      Event.find(filter).sort({ date: 1 }).skip(skip).limit(limit).populate('venueId', 'email'),
      Event.countDocuments(filter),
    ]);

    res.json({
      success: true,
      events,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get single event by ID (public).
 */
export async function getEvent(req, res, next) {
  try {
    const event = await Event.findById(req.params.id).populate('venueId', 'email');
    if (!event) throw new NotFoundError('Event not found');
    const venueProfile = await VenueProfile.findOne({ userId: event.venueId?._id ?? event.venueId });
    res.json({ success: true, event, venueProfile: venueProfile || null });
  } catch (err) {
    next(err);
  }
}

/**
 * Create event (venue only, requires active subscription).
 */
export async function createEvent(req, res, next) {
  try {
    const sub = await Subscription.findOne({ userId: req.user._id });
    const hasAccess = sub && (sub.status === 'active' || sub.status === 'trialing') &&
      (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) > new Date());
    if (!hasAccess) throw new SubscriptionRequiredError('Active subscription required to create events');

    const event = await Event.create({
      ...req.validated,
      venueId: req.user._id,
    });
    await matchAndNotifyMusicians(event);
    res.status(201).json({ success: true, event });
  } catch (err) {
    next(err);
  }
}

/**
 * Update event (owner only).
 */
export async function updateEvent(req, res, next) {
  try {
    const event = await Event.findOne({ _id: req.params.id, venueId: req.user._id });
    if (!event) throw new NotFoundError('Event not found');
    Object.assign(event, req.validated);
    await event.save();
    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
}

/**
 * List events for current venue (my events).
 */
export async function getMyEvents(req, res, next) {
  try {
    const events = await Event.find({ venueId: req.user._id }).sort({ date: 1 });
    res.json({ success: true, events });
  } catch (err) {
    next(err);
  }
}
