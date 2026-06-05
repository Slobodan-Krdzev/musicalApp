/**
 * Seed script: creates or updates the superadmin account only.
 * Run: node src/scripts/seed.js (from backend dir) or npm run seed
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User, ROLES } from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/musical-app';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'connectiongig@gmail.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'password123';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await User.deleteOne({ email: 'admin@demo.com', role: ROLES.SUPERADMIN });

  await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    { email: ADMIN_EMAIL, password: hashedPassword, role: ROLES.SUPERADMIN },
    { upsert: true, new: true }
  );

  console.log('Seed done.');
  console.log(`SuperAdmin: ${ADMIN_EMAIL}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log('Default password: password123 (set SEED_ADMIN_PASSWORD in .env for production)');
  }
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
