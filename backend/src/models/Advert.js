import mongoose from 'mongoose';

const advertSchema = new mongoose.Schema(
  {
    musicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    date: { type: Date },
    area: { type: String, trim: true },
    durationMinutes: { type: Number },
    genre: [{ type: String, trim: true }],
    description: { type: String },
    photos: [{ type: String }],
    videos: [{ url: String, platform: String }],
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'FILLED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  { timestamps: true }
);

advertSchema.index({ musicianId: 1, status: 1 });
advertSchema.index({ genre: 1, area: 1 });

export const Advert = mongoose.model('Advert', advertSchema);
