import mongoose from 'mongoose';

const dealSchema = new mongoose.Schema(
  {
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, unique: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    musicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['CONFIRMED', 'CANCELLED', 'COMPLETED'],
      default: 'CONFIRMED',
      index: true,
    },
  },
  { timestamps: true }
);

dealSchema.index({ venueId: 1, status: 1 });
dealSchema.index({ musicianId: 1, status: 1 });

export const Deal = mongoose.model('Deal', dealSchema);
