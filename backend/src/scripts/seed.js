/**
 * Seed script: creates demo users (musician, venue, superadmin) and sample data.
 * Run: node src/scripts/seed.js (from backend dir) or npm run seed
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User, ROLES } from '../models/User.js';
import { MusicianProfile } from '../models/MusicianProfile.js';
import { VenueProfile } from '../models/VenueProfile.js';
import { Event } from '../models/Event.js';
import { Advert } from '../models/Advert.js';
import { Subscription, PLAN_IDS } from '../models/Subscription.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/musical-app';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  const hashedPassword = await bcrypt.hash('password123', 12);

  const musician = await User.findOneAndUpdate(
    { email: 'musician@demo.com' },
    { email: 'musician@demo.com', password: hashedPassword, role: ROLES.MUSICIAN },
    { upsert: true, new: true }
  );
  const venue = await User.findOneAndUpdate(
    { email: 'venue@demo.com' },
    { email: 'venue@demo.com', password: hashedPassword, role: ROLES.VENUE },
    { upsert: true, new: true }
  );
  const admin = await User.findOneAndUpdate(
    { email: 'admin@demo.com' },
    { email: 'admin@demo.com', password: hashedPassword, role: ROLES.SUPERADMIN },
    { upsert: true, new: true }
  );

  await MusicianProfile.findOneAndUpdate(
    { userId: musician._id },
    {
      userId: musician._id,
      bandName: 'The Demo Band',
      bio: 'We play rock and indie. Looking for gigs in the area.',
      genres: ['Rock', 'Indie'],
      location: { city: 'Bratislava', region: 'Bratislava', country: 'Slovakia' },
      performanceRadiusKm: 100,
      socialLinks: { website: 'https://demoband.example.com', instagram: '@demoband' },
    },
    { upsert: true, new: true }
  );

  await VenueProfile.findOneAndUpdate(
    { userId: venue._id },
    {
      userId: venue._id,
      venueName: 'Demo Club',
      description: 'Live music venue in the city center.',
      capacity: 300,
      location: { city: 'Bratislava', country: 'Slovakia' },
      contactEmail: 'venue@demo.com',
    },
    { upsert: true, new: true }
  );

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);
  for (const u of [musician, venue]) {
    await Subscription.findOneAndUpdate(
      { userId: u._id },
      {
        userId: u._id,
        planId: PLAN_IDS.FREE_TRIAL,
        status: 'trialing',
        trialEnd,
        currentPeriodEnd: trialEnd,
      },
      { upsert: true }
    );
  }

  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 7);
  await Event.findOneAndUpdate(
    { title: 'Friday Live Night', venueId: venue._id },
    {
      venueId: venue._id,
      title: 'Friday Live Night',
      description: 'Looking for a band to headline. Rock or indie preferred.',
      date: eventDate,
      durationMinutes: 180,
      genre: ['Rock', 'Indie'],
      budget: 500,
      expectations: 'Own equipment, 90 min set.',
      status: 'OPEN',
    },
    { upsert: true }
  );

  await Advert.findOneAndUpdate(
    { title: 'Band seeking gigs', musicianId: musician._id },
    {
      musicianId: musician._id,
      title: 'Band seeking gigs',
      area: 'Bratislava',
      genre: ['Rock', 'Indie'],
      description: 'Available weekends. Contact for details.',
      status: 'ACTIVE',
    },
    { upsert: true }
  );

  console.log('Seed done.');
  console.log('Demo users: musician@demo.com / venue@demo.com / admin@demo.com (password: password123)');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
