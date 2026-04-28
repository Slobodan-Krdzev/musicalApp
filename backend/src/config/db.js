import mongoose from 'mongoose';
import { Application } from '../models/index.js';

/**
 * MongoDB connection with retry and connection pooling (horizontal scaling).
 * Connection string options support multiple hosts for replica sets.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/musical-app';
  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  };

  try {
    await mongoose.connect(uri, options);
    console.log('[DB] MongoDB connected');

    // Clean up legacy indexes from older Application schema versions.
    // Without this, old unique indexes on missing fields cause E11000 dup-key on { null, null }.
    try {
      await Application.collection.dropIndex('eventId_1_musicianId_1');
      console.log('[DB] Dropped legacy index: applications.eventId_1_musicianId_1');
    } catch (e) {
      // ignore if it doesn't exist
    }
    try {
      await Application.collection.dropIndex('eventId_1_musicianId_1_status_1');
    } catch (e) {
      // ignore if it doesn't exist
    }
    try {
      await Application.collection.dropIndex('musicianId_1_status_1');
    } catch (e) {
      // ignore if it doesn't exist
    }

    // Ensure current indexes exist
    try {
      await Application.syncIndexes();
    } catch (e) {
      // Some environments can race on index drops/creates and throw "index not found".
      // The app can still run safely; the next restart will reconcile indexes.
      console.warn('[DB] syncIndexes warning:', e?.message || e);
    }
  } catch (err) {
    console.error('[DB] Connection error:', err.message);
    process.exit(1);
  }
}
