import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    date: { type: Date, index: true },
    durationMinutes: { type: Number },
    genre: [{ type: String, trim: true }],
    budget: { type: Number },
    expectations: { type: String },
    status: {
      type: String,
      enum: ['DRAFT', 'OPEN', 'FILLED', 'CANCELLED'],
      default: 'OPEN',
      index: true,
    },
  },
  { timestamps: true }
);

eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ genre: 1, 'location.city': 1 });

export const Event = mongoose.model('Event', eventSchema);
