import mongoose from 'mongoose';

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    source: { type: String, default: 'homepage' },
    preferences: {
      locationLabel: { type: String, trim: true, default: '' },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      locationPrecision: { type: String, enum: ['typed', 'gps'], default: 'typed' },
      radiusKm: { type: Number, default: 40 },
      genres: [{ type: String, trim: true }],
    },
    lastDigestSentAt: { type: Date, default: null, index: true },
    emailVerified: { type: Boolean, default: false, index: true },
    verificationTokenHash: { type: String, select: false },
    verificationExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

export const NewsletterSubscriber = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);
