import { Application, Event, Deal, User, VenueProfile, MusicianProfile, Subscription } from '../models/index.js';
import { NotFoundError, ForbiddenError, SubscriptionRequiredError } from '../utils/errors.js';
import { createNotification } from '../services/notificationService.js';
import { emailService } from '../services/emailService.js';

async function requireSubscription(req) {
  const sub = await Subscription.findOne({ userId: req.user._id });
  const hasAccess = sub && (sub.status === 'active' || sub.status === 'trialing') &&
    (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) > new Date());
  if (!hasAccess) throw new SubscriptionRequiredError('Active subscription required to apply');
}

/**
 * Apply to event (musician). Creates application and notifies venue.
 */
export async function applyToEvent(req, res, next) {
  try {
    await requireSubscription(req);
    const { eventId, message } = req.validated;
    const event = await Event.findById(eventId);
    if (!event) throw new NotFoundError('Event not found');
    if (event.status !== 'OPEN') throw new ForbiddenError('Event is not open for applications');

    const existing = await Application.findOne({ eventId, musicianId: req.user._id });
    if (existing) throw new ForbiddenError('Already applied');

    const application = await Application.create({
      eventId,
      musicianId: req.user._id,
      message,
    });

    const venue = await User.findById(event.venueId).select('email');
    const musicianProfile = await MusicianProfile.findOne({ userId: req.user._id });
    const musicianName = musicianProfile?.bandName || req.user.email;

    await createNotification({
      userId: event.venueId,
      type: 'APPLICATION_SUBMITTED',
      message: `${musicianName} applied to your event "${event.title}"`,
      relatedEntityId: application._id,
      relatedEntityModel: 'Application',
      sendEmail: true,
      emailAddress: venue?.email,
      emailSubject: `New application: ${event.title}`,
      emailBody: `${musicianName} applied to "${event.title}". Log in to review.`,
    });

    res.status(201).json({ success: true, application });
  } catch (err) {
    next(err);
  }
}

/**
 * List applications for an event (venue owner).
 */
export async function getApplicationsForEvent(req, res, next) {
  try {
    const { eventId } = req.params;
    const event = await Event.findOne({ _id: eventId, venueId: req.user._id });
    if (!event) throw new NotFoundError('Event not found');
    const applications = await Application.find({ eventId })
      .populate('musicianId', 'email')
      .sort({ createdAt: -1 });
    const musicianIds = applications.map((a) => a.musicianId?._id ?? a.musicianId);
    const profiles = await MusicianProfile.find({ userId: { $in: musicianIds } });
    const profileMap = Object.fromEntries(profiles.map((p) => [p.userId.toString(), p]));
    res.json({
      success: true,
      applications: applications.map((a) => ({
        ...a.toObject(),
        musicianProfile: profileMap[(a.musicianId?._id ?? a.musicianId).toString()] || null,
      })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Accept or reject application (venue). On accept, create Deal and notify musician.
 */
export async function updateApplicationStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.validated;
    const application = await Application.findById(id).populate('eventId');
    if (!application || !application.eventId) throw new NotFoundError('Application not found');
    if (application.eventId.venueId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('Not authorized to update this application');
    }
    if (application.status !== 'PENDING') throw new ForbiddenError('Application already processed');

    application.status = status;
    await application.save();

    const event = await Event.findById(application.eventId._id);
    const musician = await User.findById(application.musicianId).select('email');
    const venueProfile = await VenueProfile.findOne({ userId: req.user._id });
    const venueName = venueProfile?.venueName || req.user.email;

    if (status === 'ACCEPTED') {
      await Deal.create({
        applicationId: application._id,
        eventId: event._id,
        musicianId: application.musicianId,
        venueId: req.user._id,
      });
      await Event.findByIdAndUpdate(event._id, { status: 'FILLED' });
      await createNotification({
        userId: application.musicianId,
        type: 'APPLICATION_ACCEPTED',
        message: `Your application for "${event.title}" was accepted by ${venueName}`,
        relatedEntityId: application._id,
        relatedEntityModel: 'Application',
        sendEmail: true,
        emailAddress: musician?.email,
        emailSubject: `Application accepted: ${event.title}`,
        emailBody: `${venueName} accepted your application for "${event.title}".`,
      });
    } else {
      await createNotification({
        userId: application.musicianId,
        type: 'APPLICATION_REJECTED',
        message: `Your application for "${event.title}" was declined`,
        relatedEntityId: application._id,
        relatedEntityModel: 'Application',
        sendEmail: true,
        emailAddress: musician?.email,
        emailSubject: `Application update: ${event.title}`,
        emailBody: `Your application for "${event.title}" was declined by ${venueName}.`,
      });
    }

    res.json({ success: true, application });
  } catch (err) {
    next(err);
  }
}

/**
 * List applications by current musician.
 */
export async function getMyApplications(req, res, next) {
  try {
    const applications = await Application.find({ musicianId: req.user._id })
      .populate('eventId')
      .sort({ createdAt: -1 });
    res.json({ success: true, applications });
  } catch (err) {
    next(err);
  }
}
