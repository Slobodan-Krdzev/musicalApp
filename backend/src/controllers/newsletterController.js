import { subscribeNewsletter, unsubscribeNewsletter } from '../services/newsletterService.js';
import { ValidationError } from '../utils/errors.js';

export async function subscribe(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!email) throw new ValidationError('Email is required');
    const result = await subscribeNewsletter(email, 'homepage');
    res.json({ success: true, ...result, message: 'Thanks for joining the party!' });
  } catch (err) {
    if (err.message === 'Invalid email address') return next(new ValidationError(err.message));
    next(err);
  }
}

export async function unsubscribe(req, res, next) {
  try {
    const { email, token } = req.query;
    if (!email || !token) throw new ValidationError('Invalid unsubscribe link');
    const result = await unsubscribeNewsletter(email, token);
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
