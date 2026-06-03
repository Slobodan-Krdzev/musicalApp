import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const ROLES = Object.freeze({
  MUSICIAN: 'MUSICIAN',
  VENUE: 'VENUE',
  SUPERADMIN: 'SUPERADMIN',
});

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      index: true,
    },
    isSuspended: { type: Boolean, default: false, index: true },
    hasCompletedProfile: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    refreshToken: { type: String, select: false },
  },
  { timestamps: true }
);

userSchema.index({ email: 1, role: 1 });
userSchema.index({ isSuspended: 1, role: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.generateVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return token;
};

userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  return token;
};

userSchema.statics.findByVerificationToken = function (rawToken) {
  const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
  return this.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpires');
};

userSchema.statics.findByPasswordResetToken = function (rawToken) {
  const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
  return this.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires +password');
};

export const User = mongoose.model('User', userSchema);
