import { Application, Event, Offering, User, MusicianProfile, VenueProfile } from '../models/index.js';
import { createNotification } from './notificationService.js';
import { emailService } from './emailService.js';
import { FRONTEND_URL } from '../config/env.js';

const AUTO_DECLINE_HOURS = 24;
const MAX_AUTO_DECLINES = 3;
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

function emailWrap(title, body) {
  return `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;"><h2 style="color:#7c3aed;">${title}</h2>${body}</div>`;
}

async function getEntityTitle(entityType, entityId) {
  if (entityType === 'EVENT') {
    const event = await Event.findById(entityId).select('title').lean();
    return event?.title || 'Event';
  }
  const offering = await Offering.findById(entityId).select('title').lean();
  return offering?.title || 'Offering';
}

async function autoDeclineExpiredApplications() {
  const now = new Date();

  const expired = await Application.find({
    status: 'PENDING',
    expiresAt: { $lte: now },
  }).lean();

  if (!expired.length) return;

  console.log(`[Scheduler] Found ${expired.length} expired application(s) to auto-decline`);

  for (const app of expired) {
    try {
      await Application.findByIdAndUpdate(app._id, { status: 'AUTO_DECLINED' });

      const entityTitle = await getEntityTitle(app.entityType, app.entityId);
      const applicant = await User.findById(app.applicantId).select('email').lean();
      const owner = await User.findById(app.ownerId).select('email').lean();

      const browseUrl = FRONTEND_URL + (app.entityType === 'EVENT' ? '/events' : '/offerings');

      for (const u of [
        { id: app.applicantId, email: applicant?.email, role: 'applicant' },
        { id: app.ownerId, email: owner?.email, role: 'owner' },
      ]) {
        const msg = u.role === 'owner'
          ? `An application for "${entityTitle}" was automatically declined because you did not respond within 24 hours.`
          : `Your application for "${entityTitle}" was automatically declined — the other party did not respond within 24 hours.`;

        await createNotification({
          userId: u.id,
          type: 'APPLICATION_EXPIRED',
          message: msg,
          relatedEntityId: app._id,
          relatedEntityModel: 'Application',
          sendEmail: true,
          emailAddress: u.email,
          emailSubject: `Application expired: ${entityTitle}`,
          emailBody: emailWrap('Application Expired', `
            <p>${msg}</p>
            <a href="${browseUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">Browse More</a>
          `),
        });
      }

      // Increment the auto-decline counter on the entity
      const Model = app.entityType === 'EVENT' ? Event : Offering;
      const entity = await Model.findByIdAndUpdate(
        app.entityId,
        { $inc: { autoDeclineCount: 1 } },
        { new: true }
      );

      if (entity && entity.autoDeclineCount >= MAX_AUTO_DECLINES && entity.status === 'ACTIVE') {
        entity.status = 'INACTIVE';
        await entity.save();

        const ownerId = app.entityType === 'EVENT' ? entity.venueId : entity.musicianId;
        const ownerUser = await User.findById(ownerId).select('email').lean();

        await createNotification({
          userId: ownerId,
          type: 'ENTITY_DEACTIVATED',
          message: `"${entityTitle}" has been deactivated after ${MAX_AUTO_DECLINES} unanswered applications.`,
          relatedEntityId: app.entityId,
          relatedEntityModel: app.entityType === 'EVENT' ? 'Event' : 'Offering',
          sendEmail: true,
          emailAddress: ownerUser?.email,
          emailSubject: `Listing deactivated: ${entityTitle}`,
          emailBody: emailWrap('Listing Deactivated', `
            <p>Your listing "<strong>${entityTitle}</strong>" has been automatically deactivated because ${MAX_AUTO_DECLINES} applications went unanswered.</p>
            <p>You can create a new listing from your dashboard.</p>
            <a href="${FRONTEND_URL}/dashboard" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">Go to Dashboard</a>
          `),
        });

        console.log(`[Scheduler] Deactivated ${app.entityType} ${app.entityId} after ${MAX_AUTO_DECLINES} auto-declines`);
      }
    } catch (err) {
      console.error(`[Scheduler] Failed to auto-decline application ${app._id}:`, err.message);
    }
  }
}

let intervalId = null;

export function startApplicationScheduler() {
  console.log(`[Scheduler] Application expiry checker started (every ${CHECK_INTERVAL_MS / 1000}s)`);
  autoDeclineExpiredApplications().catch(console.error);
  intervalId = setInterval(() => {
    autoDeclineExpiredApplications().catch(console.error);
  }, CHECK_INTERVAL_MS);
}

export function stopApplicationScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
