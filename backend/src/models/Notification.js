import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'APPLICATION_SUBMITTED',
        'INTEREST_EXPRESSED',
        'APPLICATION_ACCEPTED',
        'APPLICATION_REJECTED',
        'DEAL_CONFIRMED',
        'SUBSCRIPTION_EXPIRING',
      ],
      required: true,
      index: true,
    },
    message: { type: String, required: true },
    relatedEntityId: { type: mongoose.Schema.Types.ObjectId, refPath: 'relatedEntityModel' },
    relatedEntityModel: { type: String, enum: ['Event', 'Application', 'Deal', 'Advert'] },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
