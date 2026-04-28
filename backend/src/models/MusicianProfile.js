import mongoose from 'mongoose';

const musicianProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    bandName: { type: String, trim: true },
    bio: { type: String },
    genres: [{ type: String, trim: true }],
    services: [{ type: String, trim: true }],
    location: {
      city: String,
      region: String,
      country: String,
    },
    avatarUrl: { type: String },
    images: [{ type: String }],
    interests: [{ type: String, trim: true }],
    expectationsFromApp: [{ type: String, trim: true }],
    paymentPreferences: { type: String },
    socialLinks: {
      facebook: String,
      instagram: String,
      youtube: String,
      spotify: String,
    },
    contactPhone: String,
  },
  { timestamps: true }
);

musicianProfileSchema.index({ genres: 1 });
musicianProfileSchema.index({ 'location.country': 1, 'location.region': 1 });

export const MusicianProfile = mongoose.model('MusicianProfile', musicianProfileSchema);
