import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/** User roles - used for RBAC middleware */
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

export const User = mongoose.model('User', userSchema);
