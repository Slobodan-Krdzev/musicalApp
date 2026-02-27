import jwt from 'jsonwebtoken';
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY } from '../config/env.js';

/**
 * Issue access token (short-lived, for API auth).
 */
export function signAccessToken(payload) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });
}

/**
 * Issue refresh token (long-lived, for obtaining new access tokens).
 */
export function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });
}

/**
 * Verify access token. Returns decoded payload or throws.
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_ACCESS_SECRET);
}

/**
 * Verify refresh token.
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}
