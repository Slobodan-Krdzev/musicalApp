import mongoose from 'mongoose';

const dealChatReadStateSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lastReadAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

dealChatReadStateSchema.index({ applicationId: 1, userId: 1 }, { unique: true });

export const DealChatReadState = mongoose.model('DealChatReadState', dealChatReadStateSchema);
