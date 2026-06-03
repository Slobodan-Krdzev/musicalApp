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
    // Scheduler bookkeeping so reminder/expiry notifications are sent only once per period.
    expiringNotifiedAt: { type: Date, default: null },
    expiredNotifiedAt: { type: Date, default: null },
    // Staged pre-expiry reminders (7 days and 1 day before period end), once per period.
    reminder7SentAt: { type: Date, default: null },
    reminder1SentAt: { type: Date, default: null },
    // Set once when the subscription first becomes active, so the welcome email isn't repeated.
    welcomeNotifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

/** Status-only helper (trialing or active). Prefer the date-aware instance methods below. */
subscriptionSchema.statics.hasActiveAccess = function (status) {
  return status === 'active' || status === 'trialing';
};

/** Date-aware access check: active/trialing AND not past the current period end. */
subscriptionSchema.methods.isCurrentlyActive = function () {
  const statusOk = this.status === 'active' || this.status === 'trialing';
  if (!statusOk) return false;
  if (!this.currentPeriodEnd) return true;
  return new Date(this.currentPeriodEnd) > new Date();
};

/**
 * Access state for clients/UI. `isExpired` means the user once had a plan but it has
 * lapsed (period ended or status canceled/past_due) — used to prompt for renewal.
 */
subscriptionSchema.methods.getAccessState = function () {
  const hasAccess = this.isCurrentlyActive();
  return {
    hasAccess,
    isExpired: !hasAccess,
    cancelAtPeriodEnd: !!this.cancelAtPeriodEnd,
  };
};

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
