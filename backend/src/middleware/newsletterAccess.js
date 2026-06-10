import { User } from '../models/index.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { ForbiddenError } from '../utils/errors.js';
import { resolveNewsletterAccessFromRequest } from '../services/newsletterService.js';

/**
 * Allow logged-in platform users OR verified newsletter subscribers (httpOnly cookie).
 */
export async function requireNewsletterOrAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password -refreshToken');
      if (user && !user.isSuspended) {
        req.user = user;
        return next();
      }
    } catch {
      /* fall through to newsletter cookie */
    }
  }

  const email = await resolveNewsletterAccessFromRequest(req);
  if (email) {
    req.newsletterEmail = email;
    return next();
  }

  next(new ForbiddenError('Subscribe to the newsletter to view parties'));
}
