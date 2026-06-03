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
      latitude: Number,
      longitude: Number,
    },
    avatarUrl: { type: String },
    images: [{ type: String }],
    gigTypes: [{ type: String, trim: true }],
    servicesInterestedIn: [{ type: String, trim: true }],
    interests: [{ type: String, trim: true }],
    expectationsFromApp: [{ type: String, trim: true }],
    paymentPreferences: { type: String },
    providesAudioEquipment: { type: Boolean, default: false },
    audioEquipmentDescription: { type: String },
    providesSoundEngineer: { type: Boolean, default: false },
    providesLightingEquipment: { type: Boolean, default: false },
    lightingEquipmentDescription: { type: String },
    hasDedicatedStage: { type: Boolean, default: false },
    stageDescription: { type: String },
    socialLinks: {
      facebook: String,
      instagram: String,
      youtube: String,
      spotify: String,
    },
    contactPhone: String,
    reservationPhone: String,
  },
  { timestamps: true }
);

venueProfileSchema.index({ 'location.country': 1, 'location.city': 1 });

export const VenueProfile = mongoose.model('VenueProfile', venueProfileSchema);
