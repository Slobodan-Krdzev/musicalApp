import mongoose from 'mongoose';

/** Plan identifiers - align with Stripe Price IDs in production */
export const PLAN_IDS = Object.freeze({
  FREE_TRIAL: 'free_trial',
  PRO: 'pro',
  PREMIUM: 'premium',
});

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    planId: {
      type: String,
      enum: Object.values(PLAN_IDS),
      required: true,
      index: true,
    },
    stripeCustomerId: { type: String, index: true },
    stripeSubscriptionId: { type: String, index: true },
    status: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired'],
      default: 'active',
      index: true,
    },
    currentPeriodEnd: { type: Date, index: true },
    trialEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
  },
  { timestamps: true }
);

subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

/** Helper: user has active access (trialing or active) */
subscriptionSchema.statics.hasActiveAccess = function (status) {
  return status === 'active' || status === 'trialing';
};

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
