import mongoose from 'mongoose';

const venueProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    venueName: { type: String, trim: true },
    description: { type: String },
    capacity: { type: Number },
    location: {
      address: String,
      city: String,
      region: String,
      country: String,
    },
    images: [{ type: String }],
    contactEmail: String,
    contactPhone: String,
    website: String,
  },
  { timestamps: true }
);

venueProfileSchema.index({ 'location.country': 1, 'location.city': 1 });

export const VenueProfile = mongoose.model('VenueProfile', venueProfileSchema);
