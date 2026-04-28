import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/musical-app';

async function resetDatabase() {
  try {
    await mongoose.connect(uri);
    console.log('[ResetDB] Connected to', uri);

    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
      await mongoose.connection.db.dropCollection(col.name);
      console.log(`[ResetDB] Dropped collection: ${col.name}`);
    }

    console.log('[ResetDB] Database reset complete.');
    process.exit(0);
  } catch (err) {
    console.error('[ResetDB] Error:', err.message);
    process.exit(1);
  }
}

resetDatabase();
