import { User } from '../models/index.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { ROLES } from '../models/User.js';

/**
 * Attach req.user from JWT. Does not require role.
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      throw new UnauthorizedError('Access token required');
    }
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password -refreshToken');
    if (!user) throw new UnauthorizedError('User not found');
    if (user.isSuspended) throw new ForbiddenError('Account suspended');
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Invalid or expired token'));
    }
    next(err);
  }
}

/**
 * Require one of the given roles.
 */
export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError('Authentication required'));
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
}

/** Shorthand middlewares */
export const requireMusician = requireRoles(ROLES.MUSICIAN);
export const requireVenue = requireRoles(ROLES.VENUE);
export const requireSuperAdmin = requireRoles(ROLES.SUPERADMIN);
