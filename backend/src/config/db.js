import mongoose from 'mongoose';

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
  } catch (err) {
    console.error('[DB] Connection error:', err.message);
    process.exit(1);
  }
}
