import { Event, MusicianProfile, User } from '../models/index.js';
import { createNotification } from './notificationService.js';
import { emailService } from './emailService.js';

/**
 * When a venue creates an event, match musicians by genre + location and notify them.
 * MVP: simple genre + country match; can extend with radius/availability later.
 */
export async function matchAndNotifyMusicians(event) {
  const genreList = event.genre && event.genre.length ? event.genre : [];
  const location = event.location || {}; // if we add location to Event later
  const country = location.country;

  const musicianIds = await MusicianProfile.find({
    ...(genreList.length && { genres: { $in: genreList } }),
    ...(country && { 'location.country': country }),
  }).distinct('userId');

  const users = await User.find({ _id: { $in: musicianIds }, isSuspended: false }).select('email');

  for (const u of users) {
    await createNotification({
      userId: u._id,
      type: 'APPLICATION_SUBMITTED', // repurposed as "new event matching your profile"
      message: `New event "${event.title}" might match your profile. Check it out!`,
      relatedEntityId: event._id,
      relatedEntityModel: 'Event',
      sendEmail: true,
      emailAddress: u.email,
      emailSubject: `New event: ${event.title}`,
      emailBody: `A new event "${event.title}" has been posted and might match your profile. Log in to apply.`,
    });
  }

  return musicianIds.length;
}
