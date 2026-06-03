import { subscribeNewsletter } from '../services/newsletterService.js';
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
