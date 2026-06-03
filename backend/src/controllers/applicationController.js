import { Application, Event, Offering, Deal, User, VenueProfile, MusicianProfile, Subscription } from '../models/index.js';
import { NotFoundError, ForbiddenError, SubscriptionRequiredError } from '../utils/errors.js';
import { createNotification } from '../services/notificationService.js';
import { notifyFinalizedDeal } from '../services/partyService.js';
import { emailService } from '../services/emailService.js';
import { FRONTEND_URL } from '../config/env.js';

const REPLY_WINDOW_HOURS = 24;

async function requireSubscription(userId) {
  const sub = await Subscription.findOne({ userId });
  const hasAccess = sub && (sub.status === 'active' || sub.status === 'trialing') &&
    (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) > new Date());
  if (!hasAccess) throw new SubscriptionRequiredError('Active subscription required');
}

function emailWrap(title, body) {
  return `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;"><h2 style="color:#7c3aed;">${title}</h2>${body}</div>`;
}

function btn(href, label) {
  return `<a href="${href}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">${label}</a>`;
}

function expiresAt() {
  return new Date(Date.now() + REPLY_WINDOW_HOURS * 60 * 60 * 1000);
}

async function getApplicationPartyNames(application) {
  let entityTitle = '';
  let musicianId;
  let venueId;

  if (application.entityType === 'EVENT') {
    const event = await Event.findById(application.entityId);
    entityTitle = event?.title || 'Event';
    musicianId = application.applicantId;
    venueId = application.ownerId;
  } else {
    const offering = await Offering.findById(application.entityId);
    entityTitle = offering?.title || 'Offering';
    musicianId = application.ownerId;
    venueId = application.applicantId;
  }

  const [musicianProfile, venueProfile, applicant, owner] = await Promise.all([
    MusicianProfile.findOne({ userId: musicianId }).select('bandName').lean(),
    VenueProfile.findOne({ userId: venueId }).select('venueName').lean(),
    User.findById(application.applicantId).select('email').lean(),
    User.findById(application.ownerId).select('email').lean(),
  ]);

  const musicianName = musicianProfile?.bandName || applicant?.email || 'Musician';
  const venueName = venueProfile?.venueName || owner?.email || 'Venue';

  return {
    entityTitle,
    musicianId,
    venueId,
    musicianName,
    venueName,
    applicantName: application.entityType === 'EVENT' ? musicianName : venueName,
    ownerName: application.entityType === 'EVENT' ? venueName : musicianName,
    applicantEmail: applicant?.email,
    ownerEmail: owner?.email,
  };
}

function quoteHistoryEntry(userId, amount, message) {
  return {
    amount,
    userId,
    message: message || undefined,
    createdAt: new Date(),
  };
}

/**
 * Check if a user already has a finalized deal on a specific date.
 */
async function hasBookingOnDate(userId, date) {
  if (!date) return false;
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const deals = await Deal.find({
    $or: [{ musicianId: userId }, { venueId: userId }],
    status: 'COMPLETED',
  }).lean();

  if (!deals.length) return false;

  const entityIds = { EVENT: [], OFFERING: [] };
  for (const d of deals) entityIds[d.entityType].push(d.entityId);

  const [events, offerings] = await Promise.all([
    entityIds.EVENT.length
      ? Event.find({ _id: { $in: entityIds.EVENT }, date: { $gte: dayStart, $lte: dayEnd } }).select('_id').lean()
      : [],
    entityIds.OFFERING.length
      ? Offering.find({ _id: { $in: entityIds.OFFERING }, date: { $gte: dayStart, $lte: dayEnd } }).select('_id').lean()
      : [],
  ]);

  return events.length > 0 || offerings.length > 0;
}

// ────────────────────────────────────────
// APPLY TO EVENT (musician → venue event)
// ────────────────────────────────────────

export async function applyToEvent(req, res, next) {
  try {
    await requireSubscription(req.user._id);
    const { eventId, quote, message } = req.validated;

    const event = await Event.findById(eventId);
    if (!event) throw new NotFoundError('Event not found');
    if (event.status !== 'ACTIVE') throw new ForbiddenError('Event is not accepting applications');

    if (event.activeTo && new Date(event.activeTo) < new Date()) {
      throw new ForbiddenError('This event has expired');
    }

    const booked = await hasBookingOnDate(req.user._id, event.date);
    if (booked) throw new ForbiddenError('You already have a finalized booking on this date');

    const existing = await Application.findOne({ entityType: 'EVENT', entityId: eventId, applicantId: req.user._id });
    if (existing) throw new ForbiddenError('Already applied to this event');

    const application = await Application.create({
      entityType: 'EVENT',
      entityId: eventId,
      applicantId: req.user._id,
      ownerId: event.venueId,
      quote,
      lastQuoteBy: quote != null ? req.user._id : undefined,
      quoteHistory: quote != null ? [quoteHistoryEntry(req.user._id, quote)] : [],
      message,
      expiresAt: expiresAt(),
    });

    const venue = await User.findById(event.venueId).select('email');
    const musicianProfile = await MusicianProfile.findOne({ userId: req.user._id });
    const musicianName = musicianProfile?.bandName || req.user.email;
    const reviewUrl = `${FRONTEND_URL}/applications/${application._id}/review`;

    emailService.send(
      req.user.email,
      `Application sent: ${event.title}`,
      emailWrap('Application Sent!', `
        <p>Your application for "<strong>${event.title}</strong>" has been sent to the venue.</p>
        ${quote ? `<p><strong>Your quote:</strong> €${quote}</p>` : ''}
        <p>The venue has 24 hours to respond. We'll notify you either way.</p>
      `),
      `Application sent for "${event.title}".`
    ).catch(() => {});

    await createNotification({
      userId: event.venueId,
      type: 'APPLICATION_SUBMITTED',
      message: `${musicianName} applied to "${event.title}"${quote ? ` with a quote of €${quote}` : ''} — respond within 24h`,
      relatedEntityId: application._id,
      relatedEntityModel: 'Application',
      sendEmail: true,
      emailAddress: venue?.email,
      emailSubject: `New application: ${event.title}`,
      emailBody: emailWrap('New Application!', `
        <p><strong>${musicianName}</strong> has applied to your event "<strong>${event.title}</strong>".</p>
        ${quote ? `<p><strong>Quote:</strong> €${quote}</p>` : ''}
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        <p style="color:#f59e0b;font-weight:bold;">⏰ You have 24 hours to respond before it auto-declines.</p>
        ${btn(reviewUrl, 'Review Application')}
      `),
    });

    res.status(201).json({ success: true, application });
  } catch (err) {
    next(err);
  }
}

// ────────────────────────────────────────
// APPLY TO OFFERING (venue → musician offering)
// ────────────────────────────────────────

export async function applyToOffering(req, res, next) {
  try {
    await requireSubscription(req.user._id);
    const { offeringId, quote, message } = req.validated;

    const offering = await Offering.findById(offeringId);
    if (!offering) throw new NotFoundError('Offering not found');
    if (offering.status !== 'ACTIVE') throw new ForbiddenError('Offering is not accepting applications');

    if (offering.activeTo && new Date(offering.activeTo) < new Date()) {
      throw new ForbiddenError('This offering has expired');
    }

    const booked = await hasBookingOnDate(req.user._id, offering.date);
    if (booked) throw new ForbiddenError('You already have a finalized booking on this date');

    const existing = await Application.findOne({ entityType: 'OFFERING', entityId: offeringId, applicantId: req.user._id });
    if (existing) throw new ForbiddenError('Already applied to this offering');

    const application = await Application.create({
      entityType: 'OFFERING',
      entityId: offeringId,
      applicantId: req.user._id,
      ownerId: offering.musicianId,
      quote,
      lastQuoteBy: quote != null ? req.user._id : undefined,
      quoteHistory: quote != null ? [quoteHistoryEntry(req.user._id, quote)] : [],
      message,
      expiresAt: expiresAt(),
    });

    const musician = await User.findById(offering.musicianId).select('email');
    const venueProfile = await VenueProfile.findOne({ userId: req.user._id });
    const venueName = venueProfile?.venueName || req.user.email;
    const reviewUrl = `${FRONTEND_URL}/applications/${application._id}/review`;

    emailService.send(
      req.user.email,
      `Application sent: ${offering.title}`,
      emailWrap('Application Sent!', `
        <p>Your application for "<strong>${offering.title}</strong>" has been sent to the musician.</p>
        ${quote ? `<p><strong>Your quote:</strong> €${quote}</p>` : ''}
        <p>The musician has 24 hours to respond. We'll notify you either way.</p>
      `),
      `Application sent for "${offering.title}".`
    ).catch(() => {});

    await createNotification({
      userId: offering.musicianId,
      type: 'APPLICATION_SUBMITTED',
      message: `${venueName} applied to "${offering.title}"${quote ? ` with a quote of €${quote}` : ''} — respond within 24h`,
      relatedEntityId: application._id,
      relatedEntityModel: 'Application',
      sendEmail: true,
      emailAddress: musician?.email,
      emailSubject: `New application: ${offering.title}`,
      emailBody: emailWrap('New Application!', `
        <p><strong>${venueName}</strong> has applied to your offering "<strong>${offering.title}</strong>".</p>
        ${quote ? `<p><strong>Quote:</strong> €${quote}</p>` : ''}
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        <p style="color:#f59e0b;font-weight:bold;">⏰ You have 24 hours to respond before it auto-declines.</p>
        ${btn(reviewUrl, 'Review Application')}
      `),
    });

    res.status(201).json({ success: true, application });
  } catch (err) {
    next(err);
  }
}

// ────────────────────────────────────────
// GET APPLICATION (for review / finalize pages)
// ────────────────────────────────────────

export async function getApplication(req, res, next) {
  try {
    const app = await Application.findById(req.params.id).lean();
    if (!app) throw new NotFoundError('Application not found');

    const isApplicant = app.applicantId.toString() === req.user._id.toString();
    const isOwner = app.ownerId.toString() === req.user._id.toString();
    if (!isApplicant && !isOwner) throw new ForbiddenError('Not authorized');

    let entity = null;
    let applicantProfile = null;
    let ownerProfile = null;
    const showContactData = app.status === 'FINALIZED';

    if (app.entityType === 'EVENT') {
      entity = await Event.findById(app.entityId).lean();
      applicantProfile = await MusicianProfile.findOne({ userId: app.applicantId }).lean();
      ownerProfile = await VenueProfile.findOne({ userId: app.ownerId }).lean();
    } else {
      entity = await Offering.findById(app.entityId).lean();
      applicantProfile = await VenueProfile.findOne({ userId: app.applicantId }).lean();
      ownerProfile = await MusicianProfile.findOne({ userId: app.ownerId }).lean();
    }

    if (!showContactData) {
      const strip = (p) => {
        if (!p) return p;
        const { socialLinks, contactPhone, ...rest } = p;
        if (rest.location) {
          const { address, latitude, longitude, ...loc } = rest.location;
          rest.location = loc;
        }
        return rest;
      };
      applicantProfile = strip(applicantProfile);
      ownerProfile = strip(ownerProfile);
    }

    const deal = app.status === 'ACCEPTED' || app.status === 'FINALIZED'
      ? await Deal.findOne({ applicationId: app._id }).lean()
      : null;

    res.json({ success: true, application: app, entity, applicantProfile, ownerProfile, deal });
  } catch (err) {
    next(err);
  }
}

// ────────────────────────────────────────
// COUNTER QUOTE (either party while pending)
// ────────────────────────────────────────

export async function updateApplicationQuote(req, res, next) {
  try {
    const { quote, message } = req.validated;
    const application = await Application.findById(req.params.id);
    if (!application) throw new NotFoundError('Application not found');

    const isApplicant = application.applicantId.toString() === req.user._id.toString();
    const isOwner = application.ownerId.toString() === req.user._id.toString();
    if (!isApplicant && !isOwner) throw new ForbiddenError('Not authorized');
    if (application.status !== 'PENDING') {
      throw new ForbiddenError('Quote can only be updated while application is pending');
    }
    if (application.quote != null && application.quote === quote) {
      throw new ForbiddenError('New quote must differ from the current quote');
    }

    application.quote = quote;
    application.lastQuoteBy = req.user._id;
    application.quoteHistory.push(quoteHistoryEntry(req.user._id, quote, message));
    application.expiresAt = expiresAt();
    await application.save();

    const parties = await getApplicationPartyNames(application);
    const recipientId = isApplicant ? application.ownerId : application.applicantId;
    const proposerName = isApplicant ? parties.applicantName : parties.ownerName;
    const reviewUrl = `${FRONTEND_URL}/applications/${application._id}/review`;

    await createNotification({
      userId: recipientId,
      type: 'APPLICATION_QUOTE_UPDATED',
      message: `${proposerName} proposed €${quote} for "${parties.entityTitle}"`,
      relatedEntityId: application._id,
      relatedEntityModel: 'Application',
      sendEmail: true,
      emailAddress: isApplicant ? parties.ownerEmail : parties.applicantEmail,
      emailSubject: `New quote proposal: ${parties.entityTitle}`,
      emailBody: emailWrap('New Quote Proposal', `
        <p><strong>${proposerName}</strong> proposed a new quote for "<strong>${parties.entityTitle}</strong>".</p>
        <p><strong>New quote:</strong> €${quote}</p>
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        <p>You can respond with a counter-offer or accept the application.</p>
        ${btn(reviewUrl, 'Review Application')}
      `),
    });

    res.json({ success: true, application });
  } catch (err) {
    next(err);
  }
}

// ────────────────────────────────────────
// ACCEPT / REJECT (owner of event/offering)
// ────────────────────────────────────────

export async function updateApplicationStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.validated;

    const application = await Application.findById(id);
    if (!application) throw new NotFoundError('Application not found');

    const isApplicant = application.applicantId.toString() === req.user._id.toString();
    const isOwner = application.ownerId.toString() === req.user._id.toString();
    if (!isApplicant && !isOwner) throw new ForbiddenError('Not authorized');
    if (application.status !== 'PENDING') throw new ForbiddenError('Application already processed');

    if (status === 'REJECTED' && !isOwner) {
      throw new ForbiddenError('Only the listing owner can decline an application');
    }

    if (status === 'ACCEPTED' && isApplicant) {
      if (application.quote == null) {
        throw new ForbiddenError('Only the listing owner can accept applications without a quote');
      }
      if (application.lastQuoteBy?.toString() === req.user._id.toString()) {
        throw new ForbiddenError('Wait for the other party to respond to your quote');
      }
    }

    application.status = status;
    application.expiresAt = undefined;
    await application.save();

    const applicant = await User.findById(application.applicantId).select('email');
    const owner = await User.findById(application.ownerId).select('email');

    let entityTitle = '';
    let entityDate = null;
    let musicianId, venueId;

    if (application.entityType === 'EVENT') {
      const event = await Event.findById(application.entityId);
      entityTitle = event?.title || 'Event';
      entityDate = event?.date;
      musicianId = application.applicantId;
      venueId = application.ownerId;
    } else {
      const offering = await Offering.findById(application.entityId);
      entityTitle = offering?.title || 'Offering';
      entityDate = offering?.date;
      musicianId = application.ownerId;
      venueId = application.applicantId;
    }

    const musicianProfile = await MusicianProfile.findOne({ userId: musicianId });
    const venueProfile = await VenueProfile.findOne({ userId: venueId });
    const musicianName = musicianProfile?.bandName || applicant?.email || 'Musician';
    const venueName = venueProfile?.venueName || owner?.email || 'Venue';
    const applicantName = application.entityType === 'EVENT' ? musicianName : venueName;
    const ownerName = application.entityType === 'EVENT' ? venueName : musicianName;
    const accepterName = isApplicant ? applicantName : ownerName;

    if (status === 'ACCEPTED') {
      // Check date conflict before accepting
      for (const uid of [musicianId, venueId]) {
        const booked = await hasBookingOnDate(uid, entityDate);
        if (booked) {
          application.status = 'PENDING';
          await application.save();
          throw new ForbiddenError('One of the parties already has a finalized booking on this date');
        }
      }

      await Deal.create({
        applicationId: application._id,
        entityType: application.entityType,
        entityId: application.entityId,
        musicianId,
        venueId,
        agreedQuote: application.quote,
      });

      const finalizeUrl = `${FRONTEND_URL}/applications/${application._id}/finalize`;

      if (isApplicant) {
        await createNotification({
          userId: application.ownerId,
          type: 'APPLICATION_ACCEPTED',
          message: `${accepterName} accepted your quote of €${application.quote} for "${entityTitle}"`,
          relatedEntityId: application._id,
          relatedEntityModel: 'Application',
          sendEmail: true,
          emailAddress: owner?.email,
          emailSubject: `Quote accepted: ${entityTitle}`,
          emailBody: emailWrap('Quote Accepted!', `
            <p><strong>${accepterName}</strong> accepted your quote for "<strong>${entityTitle}</strong>".</p>
            <p><strong>Agreed quote:</strong> €${application.quote}</p>
            ${btn(finalizeUrl, 'Proceed to Finalize')}
          `),
        });

        await createNotification({
          userId: application.applicantId,
          type: 'APPLICATION_ACCEPTED',
          message: `You accepted the quote for "${entityTitle}". Proceed to finalize the deal.`,
          relatedEntityId: application._id,
          relatedEntityModel: 'Application',
          sendEmail: true,
          emailAddress: applicant?.email,
          emailSubject: `Deal confirmed: ${entityTitle}`,
          emailBody: emailWrap('Deal Confirmed!', `
            <p>You accepted the quote for "<strong>${entityTitle}</strong>".</p>
            <p><strong>Agreed quote:</strong> €${application.quote}</p>
            ${btn(finalizeUrl, 'Proceed to Finalize')}
          `),
        });
      } else {
        await createNotification({
          userId: application.applicantId,
          type: 'APPLICATION_ACCEPTED',
          message: `Your application for "${entityTitle}" was accepted by ${ownerName}!`,
          relatedEntityId: application._id,
          relatedEntityModel: 'Application',
          sendEmail: true,
          emailAddress: applicant?.email,
          emailSubject: `Application accepted: ${entityTitle}`,
          emailBody: emailWrap('Application Accepted!', `
            <p>Great news! <strong>${ownerName}</strong> has accepted your application for "<strong>${entityTitle}</strong>".</p>
            ${application.quote ? `<p><strong>Agreed quote:</strong> €${application.quote}</p>` : ''}
            ${btn(finalizeUrl, 'View Deal Details')}
          `),
        });

        await createNotification({
          userId: application.ownerId,
          type: 'APPLICATION_ACCEPTED',
          message: `You accepted ${applicantName}'s application for "${entityTitle}"`,
          relatedEntityId: application._id,
          relatedEntityModel: 'Application',
          sendEmail: true,
          emailAddress: owner?.email,
          emailSubject: `Deal confirmed: ${entityTitle}`,
          emailBody: emailWrap('Deal Confirmed!', `
            <p>You accepted <strong>${applicantName}</strong>'s application for "<strong>${entityTitle}</strong>".</p>
            ${application.quote ? `<p><strong>Agreed quote:</strong> €${application.quote}</p>` : ''}
            ${btn(finalizeUrl, 'View Deal Details')}
          `),
        });
      }
    } else {
      await createNotification({
        userId: application.applicantId,
        type: 'APPLICATION_REJECTED',
        message: `Your application for "${entityTitle}" was declined by ${ownerName}`,
        relatedEntityId: application._id,
        relatedEntityModel: 'Application',
        sendEmail: true,
        emailAddress: applicant?.email,
        emailSubject: `Application declined: ${entityTitle}`,
        emailBody: emailWrap('Application Declined', `
          <p><strong>${ownerName}</strong> has declined your application for "<strong>${entityTitle}</strong>".</p>
          <p>Don't worry — there are plenty of other opportunities on GigConnection!</p>
          ${btn(FRONTEND_URL + (application.entityType === 'EVENT' ? '/events' : '/offerings'), 'Browse More')}
        `),
      });

      emailService.send(
        owner?.email,
        `Application declined: ${entityTitle}`,
        emailWrap('Application Declined', `
          <p>You declined <strong>${applicantName}</strong>'s application for "<strong>${entityTitle}</strong>".</p>
        `),
        `You declined ${applicantName}'s application for "${entityTitle}".`
      ).catch(() => {});
    }

    res.json({ success: true, application });
  } catch (err) {
    next(err);
  }
}

// ────────────────────────────────────────
// FINALIZE (both parties must confirm)
// ────────────────────────────────────────

async function completeApplicationFinalization(application) {
  application.status = 'FINALIZED';
  await application.save();

  const deal = await Deal.findOne({ applicationId: application._id });
  if (deal) {
    deal.status = 'COMPLETED';
    await deal.save();
  }

  if (application.entityType === 'EVENT') {
    await Event.findByIdAndUpdate(application.entityId, { status: 'AGREED' });
  } else {
    await Offering.findByIdAndUpdate(application.entityId, { status: 'AGREED' });
  }

  const applicant = await User.findById(application.applicantId).select('email');
  const owner = await User.findById(application.ownerId).select('email');

  let entityTitle = '';
  if (application.entityType === 'EVENT') {
    const event = await Event.findById(application.entityId);
    entityTitle = event?.title || 'Event';
  } else {
    const offering = await Offering.findById(application.entityId);
    entityTitle = offering?.title || 'Offering';
  }

  const musicianProfile = await MusicianProfile.findOne({ userId: deal?.musicianId || application.applicantId });
  const venueProfile = await VenueProfile.findOne({ userId: deal?.venueId || application.ownerId });
  const musicianName = musicianProfile?.bandName || 'Musician';
  const venueName = venueProfile?.venueName || 'Venue';

  for (const u of [
    { id: application.applicantId, email: applicant?.email },
    { id: application.ownerId, email: owner?.email },
  ]) {
    await createNotification({
      userId: u.id,
      type: 'DEAL_CONFIRMED',
      message: `"${entityTitle}" has been finalized. Connection complete!`,
      relatedEntityId: application._id,
      relatedEntityModel: 'Application',
      sendEmail: true,
      emailAddress: u.email,
      emailSubject: `Deal finalized: ${entityTitle}`,
      emailBody: emailWrap('Deal Finalized!', `
        <p>"<strong>${entityTitle}</strong>" between <strong>${musicianName}</strong> and <strong>${venueName}</strong> is now complete.</p>
        <p>You can now see full contact details in your dashboard.</p>
        ${btn(FRONTEND_URL + '/applications/' + application._id + '/finalize', 'View Deal')}
      `),
    });
  }

  if (deal) {
    notifyFinalizedDeal(deal._id).catch((err) => {
      console.error('[Application] newsletter party notify failed:', err.message);
    });
  }

  return application;
}

async function notifyPartnerToFinalize(application, finalizerId) {
  const recipientId =
    finalizerId.toString() === application.applicantId.toString()
      ? application.ownerId
      : application.applicantId;

  let entityTitle = '';
  if (application.entityType === 'EVENT') {
    const event = await Event.findById(application.entityId);
    entityTitle = event?.title || 'Event';
  } else {
    const offering = await Offering.findById(application.entityId);
    entityTitle = offering?.title || 'Offering';
  }

  const isApplicantFinalizer = finalizerId.toString() === application.applicantId.toString();
  let finalizerName = 'Your partner';
  if (application.entityType === 'EVENT') {
    if (isApplicantFinalizer) {
      const p = await MusicianProfile.findOne({ userId: finalizerId }).select('bandName').lean();
      finalizerName = p?.bandName || 'Musician';
    } else {
      const p = await VenueProfile.findOne({ userId: finalizerId }).select('venueName').lean();
      finalizerName = p?.venueName || 'Venue';
    }
  } else if (isApplicantFinalizer) {
    const p = await VenueProfile.findOne({ userId: finalizerId }).select('venueName').lean();
    finalizerName = p?.venueName || 'Venue';
  } else {
    const p = await MusicianProfile.findOne({ userId: finalizerId }).select('bandName').lean();
    finalizerName = p?.bandName || 'Musician';
  }

  const recipient = await User.findById(recipientId).select('email');
  const finalizeUrl = `${FRONTEND_URL}/applications/${application._id}/finalize`;

  await createNotification({
    userId: recipientId,
    type: 'APPLICATION_ACCEPTED',
    message: `${finalizerName} finalized "${entityTitle}". Finalize on your side to complete the deal.`,
    relatedEntityId: application._id,
    relatedEntityModel: 'Application',
    sendEmail: true,
    emailAddress: recipient?.email,
    emailSubject: `Finalize your deal: ${entityTitle}`,
    emailBody: emailWrap('One more step to finalize', `
      <p><strong>${finalizerName}</strong> has finalized the deal for "<strong>${entityTitle}</strong>".</p>
      <p>Please finalize on your side to share contact details and complete the connection.</p>
      ${btn(finalizeUrl, 'Finalize Deal')}
    `),
  });
}

export async function finalizeApplication(req, res, next) {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) throw new NotFoundError('Application not found');

    const isApplicant = application.applicantId.toString() === req.user._id.toString();
    const isOwner = application.ownerId.toString() === req.user._id.toString();
    if (!isApplicant && !isOwner) throw new ForbiddenError('Not authorized');
    if (application.status === 'FINALIZED') {
      return res.json({ success: true, application, fullyFinalized: true });
    }
    if (application.status !== 'ACCEPTED') throw new ForbiddenError('Application must be accepted first');

    const now = new Date();
    if (isApplicant) {
      if (application.applicantFinalizedAt) {
        return res.json({
          success: true,
          application,
          fullyFinalized: !!(application.applicantFinalizedAt && application.ownerFinalizedAt),
        });
      }
      application.applicantFinalizedAt = now;
    } else {
      if (application.ownerFinalizedAt) {
        return res.json({
          success: true,
          application,
          fullyFinalized: !!(application.applicantFinalizedAt && application.ownerFinalizedAt),
        });
      }
      application.ownerFinalizedAt = now;
    }

    await application.save();

    const bothFinalized = application.applicantFinalizedAt && application.ownerFinalizedAt;
    if (bothFinalized) {
      await completeApplicationFinalization(application);
      return res.json({ success: true, application, fullyFinalized: true });
    }

    await notifyPartnerToFinalize(application, req.user._id);
    res.json({ success: true, application, fullyFinalized: false });
  } catch (err) {
    next(err);
  }
}

// ────────────────────────────────────────
// LIST MY APPLICATIONS
// ────────────────────────────────────────

export async function getMyApplications(req, res, next) {
  try {
    const applications = await Application.find({
      $or: [{ applicantId: req.user._id }, { ownerId: req.user._id }],
    }).sort({ createdAt: -1 }).lean();

    const entityIds = { EVENT: [], OFFERING: [] };
    for (const a of applications) {
      entityIds[a.entityType].push(a.entityId);
    }

    const [events, offerings] = await Promise.all([
      entityIds.EVENT.length ? Event.find({ _id: { $in: entityIds.EVENT } }).lean() : [],
      entityIds.OFFERING.length ? Offering.find({ _id: { $in: entityIds.OFFERING } }).lean() : [],
    ]);
    const entityMap = new Map();
    for (const e of events) entityMap.set(e._id.toString(), { ...e, _entityType: 'EVENT' });
    for (const o of offerings) entityMap.set(o._id.toString(), { ...o, _entityType: 'OFFERING' });

    const enriched = applications.map((a) => ({
      ...a,
      entity: entityMap.get(a.entityId.toString()) || null,
    }));

    res.json({ success: true, applications: enriched });
  } catch (err) {
    next(err);
  }
}

export async function getApplicationsForEntity(req, res, next) {
  try {
    const { entityId } = req.params;
    const applications = await Application.find({ entityId, ownerId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const profileIds = applications.map((a) => a.applicantId);
    const [musicianProfiles, venueProfiles] = await Promise.all([
      MusicianProfile.find({ userId: { $in: profileIds } }).lean(),
      VenueProfile.find({ userId: { $in: profileIds } }).lean(),
    ]);
    const profileMap = new Map();
    for (const p of musicianProfiles) profileMap.set(p.userId.toString(), p);
    for (const p of venueProfiles) profileMap.set(p.userId.toString(), p);

    const enriched = applications.map((a) => ({
      ...a,
      applicantProfile: profileMap.get(a.applicantId.toString()) || null,
    }));

    res.json({ success: true, applications: enriched });
  } catch (err) {
    next(err);
  }
}
