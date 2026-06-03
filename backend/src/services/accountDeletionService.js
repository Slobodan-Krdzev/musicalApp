import Stripe from 'stripe';
import {
  User,
  MusicianProfile,
  VenueProfile,
  Subscription,
  Notification,
  Event,
  Offering,
  Advert,
  Application,
  Deal,
  DealMessage,
  DealChatReadState,
  ROLES,
} from '../models/index.js';
import { STRIPE_SECRET_KEY } from '../config/env.js';
import { ValidationError, ForbiddenError } from '../utils/errors.js';

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' }) : null;

async function cancelStripeForUser(userId) {
  const sub = await Subscription.findOne({ userId }).select('stripeSubscriptionId stripeCustomerId').lean();
  if (!sub) return;

  if (stripe && sub.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
    } catch (err) {
      console.error('[AccountDeletion] Stripe subscription cancel failed:', err.message);
    }
  }

  if (stripe && sub.stripeCustomerId) {
    try {
      await stripe.customers.del(sub.stripeCustomerId);
    } catch (err) {
      console.error('[AccountDeletion] Stripe customer delete failed:', err.message);
    }
  }
}

export async function deleteUserAccount(userId, password) {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new ValidationError('User not found');
  if (user.role === ROLES.SUPERADMIN) {
    throw new ForbiddenError('Admin accounts cannot be deleted this way');
  }

  const valid = await user.comparePassword(password);
  if (!valid) throw new ValidationError('Incorrect password');

  await cancelStripeForUser(user._id);

  const applicationIds = (
    await Application.find({
      $or: [{ applicantId: user._id }, { ownerId: user._id }],
    }).select('_id').lean()
  ).map((a) => a._id);

  if (applicationIds.length) {
    await DealMessage.deleteMany({ applicationId: { $in: applicationIds } });
    await DealChatReadState.deleteMany({ applicationId: { $in: applicationIds } });
  }

  await Promise.all([
    Notification.deleteMany({ userId: user._id }),
    DealChatReadState.deleteMany({ userId: user._id }),
    Application.deleteMany({ $or: [{ applicantId: user._id }, { ownerId: user._id }] }),
    Deal.deleteMany({ $or: [{ musicianId: user._id }, { venueId: user._id }] }),
    Event.deleteMany({ venueId: user._id }),
    Offering.deleteMany({ musicianId: user._id }),
    Advert.deleteMany({ musicianId: user._id }),
    MusicianProfile.deleteOne({ userId: user._id }),
    VenueProfile.deleteOne({ userId: user._id }),
    Subscription.deleteOne({ userId: user._id }),
  ]);

  await User.findByIdAndDelete(user._id);

  return { deleted: true };
}
