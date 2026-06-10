import {
  subscribeNewsletter,
  unsubscribeNewsletter,
  grantNewsletterAccess,
  verifyExistingNewsletterSubscriber,
  confirmNewsletterEmail,
  resendNewsletterVerification,
  getNewsletterAccessStatus,
  setNewsletterAccessCookie,
  clearNewsletterAccessCookie,
} from '../services/newsletterService.js';
import { NEWSLETTER_GENRES } from '../constants/newsletterGenres.js';
import { ValidationError } from '../utils/errors.js';

export async function getGenres(req, res) {
  res.json({ success: true, genres: NEWSLETTER_GENRES });
}

export async function subscribe(req, res, next) {
  try {
    const { email, source, preferences } = req.body || {};
    if (!email) throw new ValidationError('Email is required');
    const result = await subscribeNewsletter(email, source || 'homepage', preferences || null);
    if (!result.needsVerification) {
      setNewsletterAccessCookie(res, result.email);
    }
    res.json({
      success: true,
      ...result,
      hasAccess: !result.needsVerification,
      message: result.needsVerification
        ? 'Check your email to verify your address before browsing parties.'
        : result.isNew
          ? 'Thanks for joining the party!'
          : 'Welcome back!',
    });
  } catch (err) {
    if (err.message === 'Invalid email address') return next(new ValidationError(err.message));
    if (err.message?.includes('Location is required')) return next(new ValidationError(err.message));
    next(err);
  }
}

/** Subscribe or refresh access for parties (email + preferences required). */
export async function grantAccess(req, res, next) {
  try {
    const { email, preferences } = req.body || {};
    if (!email) throw new ValidationError('Email is required');
    if (!preferences) throw new ValidationError('Location and preferences are required');
    const result = await grantNewsletterAccess(email, 'parties', preferences);
    if (!result.needsVerification) {
      setNewsletterAccessCookie(res, result.email);
    }
    res.json({
      success: true,
      ...result,
      hasAccess: !result.needsVerification,
      message: result.needsVerification
        ? 'We sent a verification link to your email. Confirm it to browse parties.'
        : result.isNew
          ? 'You are subscribed! Browse parties below.'
          : 'Welcome back! Your preferences are updated.',
    });
  } catch (err) {
    if (err.message === 'Invalid email address') return next(new ValidationError(err.message));
    if (err.message === 'Preferences are required') return next(new ValidationError(err.message));
    if (err.message?.includes('Location is required')) return next(new ValidationError(err.message));
    next(err);
  }
}

/** Re-enter email when access cookie expired but still subscribed. */
export async function verifyAccess(req, res, next) {
  try {
    const { email, preferences } = req.body || {};
    if (!email) throw new ValidationError('Email is required');
    const result = await verifyExistingNewsletterSubscriber(email, preferences || null);
    if (!result.needsVerification) {
      setNewsletterAccessCookie(res, result.email);
    }
    res.json({
      success: true,
      ...result,
      hasAccess: !result.needsVerification,
      message: result.needsVerification
        ? 'Please verify your email first. We sent you a new verification link.'
        : 'Access restored. Enjoy the parties!',
    });
  } catch (err) {
    if (err.message === 'Invalid email address') return next(new ValidationError(err.message));
    if (err.message === 'Email not on newsletter list') {
      return next(new ValidationError('That email is not subscribed yet. Complete the form to subscribe.'));
    }
    if (err.message?.includes('Location is required')) return next(new ValidationError(err.message));
    next(err);
  }
}

export async function accessStatus(req, res, next) {
  try {
    const status = await getNewsletterAccessStatus(req);
    res.json({ success: true, ...status });
  } catch (err) {
    next(err);
  }
}

export async function confirmEmail(req, res, next) {
  try {
    const { email, token } = req.query;
    if (!email || !token) throw new ValidationError('Invalid verification link');
    const result = await confirmNewsletterEmail(email, token);
    setNewsletterAccessCookie(res, result.email);
    res.json({
      success: true,
      ...result,
      hasAccess: true,
      message: 'Email verified! You can browse parties now.',
    });
  } catch (err) {
    if (err.message === 'Invalid verification link' || err.message === 'Invalid or expired verification link') {
      return next(new ValidationError(err.message));
    }
    next(err);
  }
}

export async function resendVerification(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!email) throw new ValidationError('Email is required');
    const result = await resendNewsletterVerification(email);
    res.json({
      success: true,
      ...result,
      hasAccess: !result.needsVerification,
      message: result.needsVerification
        ? 'Verification email sent. Check your inbox.'
        : 'Your email is already verified.',
    });
  } catch (err) {
    if (err.message === 'Invalid email address') return next(new ValidationError(err.message));
    if (err.message === 'Email not on newsletter list') {
      return next(new ValidationError('That email is not subscribed yet. Complete the form to subscribe.'));
    }
    next(err);
  }
}

export async function unsubscribe(req, res, next) {
  try {
    const { email, token } = req.query;
    if (!email || !token) throw new ValidationError('Invalid unsubscribe link');
    const result = await unsubscribeNewsletter(email, token);
    clearNewsletterAccessCookie(res);
    res.json({ success: true, ...result, message: 'You have been unsubscribed from party updates.' });
  } catch (err) {
    if (
      err.message === 'Invalid unsubscribe link' ||
      err.message === 'Email not found on newsletter list'
    ) {
      return next(new ValidationError(err.message));
    }
    next(err);
  }
}
