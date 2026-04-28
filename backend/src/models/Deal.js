import mongoose from 'mongoose';

const dealSchema = new mongoose.Schema(
  {
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, unique: true, index: true },
    entityType: { type: String, enum: ['EVENT', 'OFFERING'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    musicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    agreedQuote: { type: Number },
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
