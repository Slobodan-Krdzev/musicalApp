import { Event, VenueProfile, MusicianProfile, User, Subscription } from '../models/index.js';
import { NotFoundError, SubscriptionRequiredError, ForbiddenError } from '../utils/errors.js';
import { matchAndNotifyMusicians } from '../services/eventMatchingService.js';
import { emailService } from '../services/emailService.js';

async function expireStaleEvents() {
  await Event.updateMany(
    { status: 'ACTIVE', activeTo: { $lt: new Date() } },
    { $set: { status: 'EXPIRED' } }
  );
}

export async function listEvents(req, res, next) {
  try {
    await expireStaleEvents();

    const userRole = req.user?.role;
    if (userRole !== 'MUSICIAN') {
      return res.json({ success: true, events: [], pagination: { page: 1, limit: 12, total: 0, pages: 0 } });
    }

    const { lookingFor, dateFrom, dateTo, venueId, page = 1, limit = 12 } = req.validated ?? {};
    const filter = { status: 'ACTIVE' };

    if (lookingFor) filter.lookingFor = { $in: [lookingFor] };
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = dateFrom;
      if (dateTo) filter.date.$lte = dateTo;
    }
    if (venueId) filter.venueId = venueId;

    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      Event.find(filter).sort({ date: 1 }).skip(skip).limit(limit).lean(),
      Event.countDocuments(filter),
    ]);

    const venueIds = [...new Set(events.map((e) => e.venueId.toString()))];
    const venueProfiles = await VenueProfile.find({ userId: { $in: venueIds } }).lean();
    const venueMap = Object.fromEntries(venueProfiles.map((v) => [v.userId.toString(), v]));

    const enriched = events.map((e) => ({
      ...e,
      venueProfile: venueMap[e.venueId.toString()] || null,
    }));

    res.json({
      success: true,
      events: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getEvent(req, res, next) {
  try {
    await expireStaleEvents();

    const event = await Event.findById(req.params.id).lean();
    if (!event) throw new NotFoundError('Event not found');

    const venueProfile = await VenueProfile.findOne({ userId: event.venueId }).lean();

    res.json({ success: true, event, venueProfile: venueProfile || null });
  } catch (err) {
    next(err);
  }
}

export async function createEvent(req, res, next) {
  try {
    const sub = await Subscription.findOne({ userId: req.user._id });
    const hasAccess = sub && (sub.status === 'active' || sub.status === 'trialing') &&
      (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) > new Date());
    if (!hasAccess) throw new SubscriptionRequiredError('Active subscription required to create events');

    const venueProfile = await VenueProfile.findOne({ userId: req.user._id }).lean();

    const event = await Event.create({
      ...req.validated,
      venueId: req.user._id,
      status: 'ACTIVE',
    });

    emailService.send(
      req.user.email,
      `Event created: ${event.title}`,
      `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
          <h2 style="color:#7c3aed;">Event Created Successfully!</h2>
          <p>Your event "<strong>${event.title}</strong>" is now live.</p>
          <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
          <p><strong>Active until:</strong> ${new Date(event.activeTo).toLocaleDateString()}</p>
          ${event.description ? `<p>${event.description.slice(0, 300)}</p>` : ''}
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">Go to Dashboard</a>
        </div>
      `,
      `Your event "${event.title}" is now live.`
    ).catch(() => {});

    matchAndNotifyMusicians(event, venueProfile).catch(() => {});

    res.status(201).json({ success: true, event });
  } catch (err) {
    next(err);
  }
}

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

export async function getMyEvents(req, res, next) {
  try {
    if (req.user.role !== 'VENUE') {
      return res.json({ success: true, events: [] });
    }
    await expireStaleEvents();
    const events = await Event.find({ venueId: req.user._id }).sort({ date: -1 });
    res.json({ success: true, events });
  } catch (err) {
    next(err);
  }
}
