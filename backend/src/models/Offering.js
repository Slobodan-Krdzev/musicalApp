import mongoose from 'mongoose';

const offeringSchema = new mongoose.Schema(
  {
    musicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    date: { type: Date, required: true, index: true },
    activeTo: { type: Date, required: true, index: true },
    lookingFor: [{ type: String, trim: true }],
    approximatePrice: { type: Number },
    paymentType: { type: String, trim: true },
    genres: [{ type: String, trim: true }],
    interests: [{ type: String, trim: true }],
    autoDeclineCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'AGREED', 'CANCELLED', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
  },
  { timestamps: true }
);

offeringSchema.index({ date: 1, status: 1 });
offeringSchema.index({ activeTo: 1, status: 1 });
offeringSchema.index({ genres: 1 });

export const Offering = mongoose.model('Offering', offeringSchema);
