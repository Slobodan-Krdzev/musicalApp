import { MusicianProfile, VenueProfile, User } from '../models/index.js';
import { createNotification } from './notificationService.js';

/**
 * When a venue creates an event, find musicians with matching genres/interests/location and notify them.
 */
export async function matchAndNotifyMusicians(event, venueProfile) {
  const lookingFor = event.lookingFor?.length ? event.lookingFor : [];

  const query = {};
  if (lookingFor.length) {
    query.$or = [
      { genres: { $in: lookingFor } },
      { interests: { $in: lookingFor } },
    ];
  }
  if (venueProfile?.location?.country) {
    query['location.country'] = venueProfile.location.country;
  }

  const musicianProfiles = await MusicianProfile.find(query).lean();
  const userIds = musicianProfiles.map((p) => p.userId);
  if (!userIds.length) return 0;

  const users = await User.find({ _id: { $in: userIds }, isSuspended: false }).select('email');

  for (const u of users) {
    await createNotification({
      userId: u._id,
      type: 'NEW_MATCHING_EVENT',
      message: `New event "${event.title}" matches your profile. Check it out!`,
      relatedEntityId: event._id,
      relatedEntityModel: 'Event',
      sendEmail: true,
      emailAddress: u.email,
      emailSubject: `New matching event: ${event.title}`,
      emailBody: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
          <h2 style="color:#7c3aed;">New Event Matches Your Profile!</h2>
          <p>A venue has posted "<strong>${event.title}</strong>" and it looks like a great fit for you.</p>
          <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
          ${event.description ? `<p>${event.description.slice(0, 200)}...</p>` : ''}
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/events" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">View Event</a>
        </div>
      `,
    });
  }

  return users.length;
}

/**
 * When a musician creates an offering, find venues with matching gigTypes/interests/location and notify them.
 */
export async function matchAndNotifyVenues(offering, musicianProfile) {
  const genres = offering.genres?.length ? offering.genres : [];
  const interests = offering.interests?.length ? offering.interests : [];
  const allTags = [...genres, ...interests];

  const query = {};
  if (allTags.length) {
    query.$or = [
      { gigTypes: { $in: allTags } },
      { servicesInterestedIn: { $in: allTags } },
      { interests: { $in: allTags } },
    ];
  }
  if (musicianProfile?.location?.country) {
    query['location.country'] = musicianProfile.location.country;
  }

  const venueProfiles = await VenueProfile.find(query).lean();
  const userIds = venueProfiles.map((p) => p.userId);
  if (!userIds.length) return 0;

  const users = await User.find({ _id: { $in: userIds }, isSuspended: false }).select('email');

  for (const u of users) {
    await createNotification({
      userId: u._id,
      type: 'NEW_MATCHING_OFFERING',
      message: `Musician "${musicianProfile?.bandName || 'A musician'}" is available: "${offering.title}". Check it out!`,
      relatedEntityId: offering._id,
      relatedEntityModel: 'Offering',
      sendEmail: true,
      emailAddress: u.email,
      emailSubject: `New musician offering: ${offering.title}`,
      emailBody: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
          <h2 style="color:#7c3aed;">New Musician Offering!</h2>
          <p>"<strong>${musicianProfile?.bandName || 'A musician'}</strong>" has posted an offering: "<strong>${offering.title}</strong>"</p>
          <p><strong>Date:</strong> ${new Date(offering.date).toLocaleDateString()}</p>
          ${offering.description ? `<p>${offering.description.slice(0, 200)}...</p>` : ''}
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/offerings" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">View Offering</a>
        </div>
      `,
    });
  }

  return users.length;
}
