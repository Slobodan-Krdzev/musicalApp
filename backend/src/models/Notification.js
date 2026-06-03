import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'APPLICATION_SUBMITTED',
        'APPLICATION_QUOTE_UPDATED',
        'INTEREST_EXPRESSED',
        'APPLICATION_ACCEPTED',
        'APPLICATION_REJECTED',
        'APPLICATION_EXPIRED',
        'ENTITY_DEACTIVATED',
        'DEAL_CONFIRMED',
        'DEAL_CHAT_MESSAGE',
        'SUBSCRIPTION_STARTED',
        'SUBSCRIPTION_EXPIRING',
        'SUBSCRIPTION_EXPIRED',
        'SUBSCRIPTION_RENEWED',
        'SUBSCRIPTION_CANCELED',
        'NEW_MATCHING_EVENT',
        'NEW_MATCHING_OFFERING',
        'EVENT_CREATED',
        'OFFERING_CREATED',
      ],
      required: true,
      index: true,
    },
    message: { type: String, required: true },
    relatedEntityId: { type: mongoose.Schema.Types.ObjectId, refPath: 'relatedEntityModel' },
    relatedEntityModel: { type: String, enum: ['Event', 'Offering', 'Application', 'Deal', 'Advert'] },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
