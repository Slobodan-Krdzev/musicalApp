import { User, MusicianProfile, VenueProfile, Subscription } from '../models/index.js';
import { ROLES } from '../models/User.js';
import { NotFoundError } from '../utils/errors.js';
import { emailService } from '../services/emailService.js';
import { getDashboardSummary as buildDashboardSummary } from '../services/dashboardSummaryService.js';

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

export async function listVenues(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;
    const [profiles, total] = await Promise.all([
      VenueProfile.find({}).skip(skip).limit(limit).lean(),
      VenueProfile.countDocuments({}),
    ]);
    const userIds = profiles.map((p) => p.userId);
    const users = await User.find({ _id: { $in: userIds }, isSuspended: false }).select('email role').lean();
    const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));
    const list = profiles.map((p) => {
      const u = userMap[p.userId.toString()];
      return { ...p, userId: p.userId, email: u?.email, role: u?.role };
    });
    res.json({
      success: true,
      venues: list,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

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

export async function updateMyProfile(req, res, next) {
  try {
    const userId = req.user._id;
    const data = req.validated;

    let profile;
    if (req.user.role === ROLES.MUSICIAN) {
      profile = await MusicianProfile.findOneAndUpdate(
        { userId },
        { $set: data },
        { new: true, upsert: true }
      );
    } else if (req.user.role === ROLES.VENUE) {
      profile = await VenueProfile.findOneAndUpdate(
        { userId },
        { $set: data },
        { new: true, upsert: true }
      );
    } else {
      return res.status(400).json({ success: false, error: 'No profile for this role' });
    }

    await User.findByIdAndUpdate(userId, { hasCompletedProfile: true });

    const user = await User.findById(userId).select('+emailVerificationToken +emailVerificationExpires');
    if (user && !user.isEmailVerified) {
      const rawToken = user.generateVerificationToken();
      await user.save();
      await emailService.sendVerificationEmail(user.email, rawToken);
    }

    res.json({ success: true, profile });
  } catch (err) {
    next(err);
  }
}

export async function getMySubscription(req, res, next) {
  try {
    const sub = await Subscription.findOne({ userId: req.user._id });
    if (!sub) {
      return res.json({ success: true, subscription: null });
    }
    res.json({
      success: true,
      subscription: { ...sub.toObject(), ...sub.getAccessState() },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyDashboardSummary(req, res, next) {
  try {
    const summary = await buildDashboardSummary(req.user._id, req.user.role);
    if (!summary) {
      return res.json({ success: true, summary: null });
    }
    res.json({ success: true, summary });
  } catch (err) {
    next(err);
  }
}
