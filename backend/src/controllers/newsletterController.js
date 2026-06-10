import {
  subscribeNewsletter,
  unsubscribeNewsletter,
  grantNewsletterAccess,
  verifyExistingNewsletterSubscriber,
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
    setNewsletterAccessCookie(res, result.email);
    res.json({
      success: true,
      ...result,
      hasAccess: true,
      message: result.isNew ? 'Thanks for joining the party!' : 'Welcome back!',
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
    setNewsletterAccessCookie(res, result.email);
    res.json({
      success: true,
      ...result,
      hasAccess: true,
      message: result.isNew
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
    setNewsletterAccessCookie(res, result.email);
    res.json({
      success: true,
      ...result,
      hasAccess: true,
      message: 'Access restored. Enjoy the parties!',
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
