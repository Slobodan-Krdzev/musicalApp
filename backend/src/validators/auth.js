import { z } from 'zod';
import { ROLES } from '../models/User.js';

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum([ROLES.MUSICIAN, ROLES.VENUE], { required_error: 'Role is required' }),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
