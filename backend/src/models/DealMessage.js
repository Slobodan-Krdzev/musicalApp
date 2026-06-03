import mongoose from 'mongoose';

const dealMessageSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    body: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

dealMessageSchema.index({ applicationId: 1, createdAt: 1 });

export const DealMessage = mongoose.model('DealMessage', dealMessageSchema);
