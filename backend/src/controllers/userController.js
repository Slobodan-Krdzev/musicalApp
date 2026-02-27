import { User, MusicianProfile, VenueProfile, Subscription } from '../models/index.js';
import { ROLES } from '../models/User.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * List musician profiles (for venues to browse). Public, paginated.
 */
export async function listMusicians(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const genre = req.query.genre;
    const filter = {};
    if (genre) filter.genres = { $in: [genre] };
    const skip = (page - 1) * limit;
    const [profiles, total] = await Promise.all([
      MusicianProfile.find(filter).skip(skip).limit(limit).lean(),
      MusicianProfile.countDocuments(filter),
    ]);
    const userIds = profiles.map((p) => p.userId);
    const users = await User.find({ _id: { $in: userIds }, isSuspended: false }).select('email').lean();
    const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));
    const list = profiles.map((p) => ({
      ...p,
      userId: p.userId,
      email: userMap[p.userId.toString()]?.email,
    }));
    res.json({
      success: true,
      musicians: list,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get public profile by user ID (musician or venue).
 */
export async function getProfile(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password -refreshToken');
    if (!user) throw new NotFoundError('User not found');
    if (user.isSuspended) throw new NotFoundError('User not found');

    let profile = null;
    if (user.role === ROLES.MUSICIAN) {
      profile = await MusicianProfile.findOne({ userId: id });
    } else if (user.role === ROLES.VENUE) {
      profile = await VenueProfile.findOne({ userId: id });
    }

    res.json({ success: true, user, profile });
  } catch (err) {
    next(err);
  }
}

/**
 * Get current user's own profile (musician or venue).
 */
export async function getMyProfile(req, res, next) {
  try {
    const userId = req.user._id;
    if (req.user.role === ROLES.MUSICIAN) {
      let profile = await MusicianProfile.findOne({ userId });
      if (!profile) profile = await MusicianProfile.create({ userId });
      return res.json({ success: true, profile });
    }
    if (req.user.role === ROLES.VENUE) {
      let profile = await VenueProfile.findOne({ userId });
      if (!profile) profile = await VenueProfile.create({ userId });
      return res.json({ success: true, profile });
    }
    res.json({ success: true, profile: null });
  } catch (err) {
    next(err);
  }
}

/**
 * Update current user's profile.
 */
export async function updateMyProfile(req, res, next) {
  try {
    const userId = req.user._id;
    const data = req.validated;

    if (req.user.role === ROLES.MUSICIAN) {
      const profile = await MusicianProfile.findOneAndUpdate(
        { userId },
        { $set: data },
        { new: true, upsert: true }
      );
      return res.json({ success: true, profile });
    }
    if (req.user.role === ROLES.VENUE) {
      const profile = await VenueProfile.findOneAndUpdate(
        { userId },
        { $set: data },
        { new: true, upsert: true }
      );
      return res.json({ success: true, profile });
    }
    res.status(400).json({ success: false, error: 'No profile for this role' });
  } catch (err) {
    next(err);
  }
}

/**
 * Get current user's subscription status.
 */
export async function getMySubscription(req, res, next) {
  try {
    const sub = await Subscription.findOne({ userId: req.user._id });
    res.json({ success: true, subscription: sub || null });
  } catch (err) {
    next(err);
  }
}
