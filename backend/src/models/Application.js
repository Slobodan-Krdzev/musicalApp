import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    entityType: { type: String, enum: ['EVENT', 'OFFERING'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quote: { type: Number, min: 0 },
    lastQuoteBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    quoteHistory: [
      {
        amount: { type: Number, min: 0, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, maxLength: 500 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    message: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'FINALIZED', 'AUTO_DECLINED'],
      default: 'PENDING',
      index: true,
    },
    expiresAt: { type: Date, index: true },
    applicantFinalizedAt: { type: Date },
    ownerFinalizedAt: { type: Date },
  },
  { timestamps: true }
);

applicationSchema.index({ entityType: 1, entityId: 1, applicantId: 1 }, { unique: true });
applicationSchema.index({ applicantId: 1, status: 1 });
applicationSchema.index({ ownerId: 1, status: 1 });
applicationSchema.index({ status: 1, expiresAt: 1 });

export const Application = mongoose.model('Application', applicationSchema);
