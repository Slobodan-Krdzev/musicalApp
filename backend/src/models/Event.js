import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    date: { type: Date, required: true, index: true },
    activeTo: { type: Date, index: true },
    lookingFor: [{ type: String, trim: true }],
    approximatePayment: { type: Number },
    paymentType: { type: String, trim: true },
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

eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ lookingFor: 1 });
eventSchema.index({ activeTo: 1, status: 1 });

export const Event = mongoose.model('Event', eventSchema);
