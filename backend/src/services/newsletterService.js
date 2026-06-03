import { NewsletterSubscriber } from '../models/index.js';
import { emailService } from './emailService.js';
import { FRONTEND_URL, JWT_ACCESS_SECRET } from '../config/env.js';
import crypto from 'crypto';

const UNSUBSCRIBE_SECRET = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET || JWT_ACCESS_SECRET;

function emailWrap(title, body) {
  return `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;"><h2 style="color:#7c3aed;">${title}</h2>${body}</div>`;
}

export function createNewsletterUnsubscribeToken(email) {
  const normalized = String(email).trim().toLowerCase();
  return crypto.createHmac('sha256', UNSUBSCRIBE_SECRET).update(normalized).digest('hex');
}

export function buildNewsletterUnsubscribeUrl(email) {
  const normalized = String(email).trim().toLowerCase();
  const token = createNewsletterUnsubscribeToken(normalized);
  const params = new URLSearchParams({ email: normalized, token });
  return `${FRONTEND_URL}/newsletter/unsubscribe?${params.toString()}`;
}

function newsletterUnsubscribeFooter(email) {
  const url = buildNewsletterUnsubscribeUrl(email);
  return `<p style="color:#888;font-size:12px;margin-top:24px;border-top:1px solid #333;padding-top:16px;">
    You received this because you subscribed to GigConnection party updates.
    <a href="${url}" style="color:#7c3aed;">Unsubscribe</a>
  </p>`;
}

/**
 * Subscribe an email to the party newsletter. Idempotent — re-subscribing is OK.
 */
export async function subscribeNewsletter(email, source = 'homepage') {
  const normalized = String(email).trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('Invalid email address');
  }

  await NewsletterSubscriber.findOneAndUpdate(
    { email: normalized },
    { email: normalized, source },
    { upsert: true, new: true }
  );

  await emailService.send(
    normalized,
    'Thanks for joining the party!',
    emailWrap(
      'Wanna Party!',
      `<p>Thanks for subscribing to GigConnection party updates!</p>
       <p>We'll email you about upcoming events, live music, and parties near you.</p>
       <a href="${FRONTEND_URL}/parties" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">Browse parties</a>
       ${newsletterUnsubscribeFooter(normalized)}`
    ),
    `Thanks for joining the GigConnection party newsletter! We'll send you upcoming events and parties. Unsubscribe: ${buildNewsletterUnsubscribeUrl(normalized)}`
  );

  return { email: normalized };
}

/**
 * Remove a subscriber using a signed unsubscribe link from newsletter emails.
 */
export async function unsubscribeNewsletter(email, token) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || !token) throw new Error('Invalid unsubscribe link');

  const expected = createNewsletterUnsubscribeToken(normalized);
  const a = Buffer.from(String(token));
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('Invalid unsubscribe link');
  }

  const removed = await NewsletterSubscriber.findOneAndDelete({ email: normalized });
  if (!removed) throw new Error('Email not found on newsletter list');

  return { email: normalized };
}

/**
 * Notify all newsletter subscribers when a new party is finalized.
 */
export async function notifyNewsletterNewParty(party) {
  const subscribers = await NewsletterSubscriber.find().select('email').lean();
  if (!subscribers.length) return;

  const dateStr = party.date
    ? new Date(party.date).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'TBA';

  const loc = party.location;
  const locationStr = [loc?.city, loc?.country].filter(Boolean).join(', ') || 'Location TBA';
  const tagLine = party.tags?.slice(0, 5).join(', ');

  const subject = `New party: ${party.title}`;
  const bodyCore = `<p><strong>${party.title}</strong></p>
     <p><strong>When:</strong> ${dateStr}</p>
     <p><strong>Where:</strong> ${locationStr}</p>
     <p><strong>Venue:</strong> ${party.venueName} · <strong>Artist:</strong> ${party.musicianName}</p>
     ${tagLine ? `<p><strong>Tags:</strong> ${tagLine}</p>` : ''}
     ${party.description ? `<p>${party.description.slice(0, 280)}${party.description.length > 280 ? '…' : ''}</p>` : ''}
     <a href="${FRONTEND_URL}/parties" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">See all parties</a>`;

  for (const sub of subscribers) {
    const html = emailWrap('New party on GigConnection', bodyCore + newsletterUnsubscribeFooter(sub.email));
    const text = `New party: ${party.title} on ${dateStr} at ${locationStr}. ${party.venueName} + ${party.musicianName}. ${FRONTEND_URL}/parties\n\nUnsubscribe: ${buildNewsletterUnsubscribeUrl(sub.email)}`;
    emailService.send(sub.email, subject, html, text).catch((err) => {
      console.error(`[Newsletter] Failed to notify ${sub.email}:`, err.message);
    });
  }
}
