import { User } from '../models/index.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { ValidationError } from '../utils/errors.js';
import { Subscription, PLAN_IDS } from '../models/index.js';
import { MusicianProfile, VenueProfile } from '../models/index.js';
import { emailService } from '../services/emailService.js';

const TRIAL_DAYS = 14;

export async function register(req, res, next) {
  try {
    const { email, password, role } = req.validated;
    const existing = await User.findOne({ email });
    if (existing) throw new ValidationError('Email already registered');

    const user = await User.create({ email, password, role });

    if (role !== 'SUPERADMIN') {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
      await Subscription.create({
        userId: user._id,
        planId: PLAN_IDS.FREE_TRIAL,
        status: 'trialing',
        trialEnd,
        currentPeriodEnd: trialEnd,
      });
    }

    const accessToken = signAccessToken({ userId: user._id.toString() });
    const refreshToken = signRefreshToken({ userId: user._id.toString() });
    await User.findByIdAndUpdate(user._id, { refreshToken });

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.refreshToken;

    res.status(201).json({
      success: true,
      user: safeUser,
      accessToken,
      refreshToken,
      expiresIn: 900,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.validated;
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new ValidationError('Invalid email or password');
    const valid = await user.comparePassword(password);
    if (!valid) throw new ValidationError('Invalid email or password');
    if (user.isSuspended) throw new ValidationError('Account suspended');

    const accessToken = signAccessToken({ userId: user._id.toString() });
    const refreshToken = signRefreshToken({ userId: user._id.toString() });
    await User.findByIdAndUpdate(user._id, { refreshToken });

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.refreshToken;

    res.json({
      success: true,
      user: safeUser,
      accessToken,
      refreshToken,
      expiresIn: 900,
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken: token } = req.validated;
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== token) throw new ValidationError('Invalid refresh token');

    const accessToken = signAccessToken({ userId: user._id.toString() });
    const newRefresh = signRefreshToken({ userId: user._id.toString() });
    await User.findByIdAndUpdate(user._id, { refreshToken: newRefresh });

    res.json({
      success: true,
      accessToken,
      refreshToken: newRefresh,
      expiresIn: 900,
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) throw new ValidationError('Verification token required');

    const user = await User.findByVerificationToken(token);
    if (!user) throw new ValidationError('Invalid or expired verification token');

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    let profileName = '';
    if (user.role === 'MUSICIAN') {
      const p = await MusicianProfile.findOne({ userId: user._id });
      profileName = p?.bandName || '';
    } else if (user.role === 'VENUE') {
      const p = await VenueProfile.findOne({ userId: user._id });
      profileName = p?.venueName || '';
    }

    await emailService.sendProfileVerifiedEmail(user.email, profileName);

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
}

export async function resendVerification(req, res, next) {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('+emailVerificationToken +emailVerificationExpires');
    if (!user) throw new ValidationError('User not found');
    if (user.isEmailVerified) {
      return res.json({ success: true, message: 'Email already verified' });
    }

    const rawToken = user.generateVerificationToken();
    await user.save();
    await emailService.sendVerificationEmail(user.email, rawToken);

    res.json({ success: true, message: 'Verification email sent' });
  } catch (err) {
    next(err);
  }
}
