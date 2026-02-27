import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    musicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
  },
  { timestamps: true }
);

applicationSchema.index({ eventId: 1, musicianId: 1 }, { unique: true });
applicationSchema.index({ musicianId: 1, status: 1 });

export const Application = mongoose.model('Application', applicationSchema);
