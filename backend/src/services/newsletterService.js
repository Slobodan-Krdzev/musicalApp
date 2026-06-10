import { NewsletterSubscriber } from '../models/index.js';
import { emailService } from './emailService.js';
import { geocodeLocationLabel } from './newsletterGeocode.js';
import { filterPartiesForSubscriber } from './newsletterMatchingService.js';
import { listUpcomingPartiesForDigest } from './partyService.js';
import {
  DEFAULT_NEWSLETTER_RADIUS_KM,
  NEWSLETTER_DIGEST_INTERVAL_MS,
  NEWSLETTER_GENRES,
} from '../constants/newsletterGenres.js';
import { FRONTEND_URL, JWT_ACCESS_SECRET, NODE_ENV } from '../config/env.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const UNSUBSCRIBE_SECRET = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET || JWT_ACCESS_SECRET;
const ACCESS_SECRET = process.env.NEWSLETTER_ACCESS_SECRET || UNSUBSCRIBE_SECRET;
export const NEWSLETTER_ACCESS_COOKIE = 'gigconnection_newsletter_access';
const ACCESS_MAX_AGE_SEC = parseInt(process.env.NEWSLETTER_ACCESS_MAX_AGE_SEC || String(90 * 24 * 60 * 60), 10);

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseCookies(req) {
  const header = req.headers?.cookie;
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map((part) => {
      const idx = part.indexOf('=');
      if (idx === -1) return [part.trim(), ''];
      const key = part.slice(0, idx).trim();
      const value = part.slice(idx + 1).trim();
      return [key, decodeURIComponent(value)];
    })
  );
}

export function createNewsletterAccessToken(email) {
  const normalized = normalizeEmail(email);
  return jwt.sign({ email: normalized, purpose: 'newsletter_access' }, ACCESS_SECRET, {
    expiresIn: ACCESS_MAX_AGE_SEC,
  });
}

export function verifyNewsletterAccessToken(token) {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    if (decoded.purpose !== 'newsletter_access' || !decoded.email) return null;
    return normalizeEmail(decoded.email);
  } catch {
    return null;
  }
}

export function setNewsletterAccessCookie(res, email) {
  const token = createNewsletterAccessToken(email);
  const secure = NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${NEWSLETTER_ACCESS_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ACCESS_MAX_AGE_SEC}${secure}`
  );
}

export function clearNewsletterAccessCookie(res) {
  const secure = NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${NEWSLETTER_ACCESS_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
  );
}

/** Verify cookie token and confirm email is still an active subscriber. */
export async function resolveNewsletterAccessFromRequest(req) {
  const cookies = parseCookies(req);
  const token = cookies[NEWSLETTER_ACCESS_COOKIE];
  const email = verifyNewsletterAccessToken(token);
  if (!email) return null;

  const sub = await NewsletterSubscriber.findOne({ email }).select('_id').lean();
  return sub ? email : null;
}

export async function getNewsletterAccessStatus(req) {
  const email = await resolveNewsletterAccessFromRequest(req);
  return { hasAccess: !!email, email: email || undefined };
}

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
 * Normalize and enrich subscriber preferences (typed location + optional GPS).
 */
export async function normalizeSubscriberPreferences(input = {}) {
  const locationLabel = String(input.locationLabel || '').trim();
  let latitude = input.latitude != null && input.latitude !== '' ? Number(input.latitude) : null;
  let longitude = input.longitude != null && input.longitude !== '' ? Number(input.longitude) : null;
  const locationPrecision = input.locationPrecision === 'gps' ? 'gps' : 'typed';

  if (!locationLabel && (latitude == null || longitude == null || Number.isNaN(latitude) || Number.isNaN(longitude))) {
    throw new Error('Location is required — type your city or enable precise location');
  }

  if (locationPrecision === 'gps' && latitude != null && longitude != null && !Number.isNaN(latitude) && !Number.isNaN(longitude)) {
    // Keep GPS coordinates as provided.
  } else if (locationLabel) {
    const geocoded = await geocodeLocationLabel(locationLabel);
    if (geocoded) {
      latitude = geocoded.latitude;
      longitude = geocoded.longitude;
    }
  }

  const genres = Array.isArray(input.genres)
    ? [...new Set(input.genres.map((g) => String(g).trim()).filter(Boolean))].filter((g) =>
        NEWSLETTER_GENRES.some((known) => known.toLowerCase() === g.toLowerCase())
      )
    : [];

  const radiusKm = Math.min(200, Math.max(5, Number(input.radiusKm) || DEFAULT_NEWSLETTER_RADIUS_KM));

  return {
    locationLabel: locationLabel || 'My area',
    latitude: Number.isNaN(latitude) ? null : latitude,
    longitude: Number.isNaN(longitude) ? null : longitude,
    locationPrecision,
    radiusKm,
    genres,
  };
}

function formatPartyDate(date) {
  if (!date) return 'TBA';
  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildDigestPartyHtml(party) {
  const area = party.locationArea;
  const locationStr = [area?.city, area?.country].filter(Boolean).join(', ') || 'Near you';
  const tags = party.tags?.slice(0, 4).join(' · ');
  return `<div style="border:1px solid #333;border-radius:12px;padding:16px;margin:16px 0;background:#111;">
    <p style="margin:0 0 6px;font-size:16px;font-weight:bold;color:#fff;">${party.title}</p>
    <p style="margin:0 0 4px;color:#ccc;font-size:14px;"><strong>When:</strong> ${formatPartyDate(party.date)}</p>
    <p style="margin:0 0 4px;color:#ccc;font-size:14px;"><strong>Where:</strong> ${locationStr}</p>
    <p style="margin:0 0 4px;color:#ccc;font-size:14px;"><strong>${party.musicianName}</strong> at <strong>${party.venueName}</strong></p>
    ${tags ? `<p style="margin:8px 0 0;color:#888;font-size:12px;">${tags}</p>` : ''}
  </div>`;
}

/**
 * Subscribe an email to the party newsletter. Idempotent — re-subscribing is OK.
 * Welcome email is sent only for new subscribers.
 */
export async function subscribeNewsletter(email, source = 'homepage', preferencesInput = null) {
  const normalized = normalizeEmail(email);
  if (!normalized || !isValidEmail(normalized)) {
    throw new Error('Invalid email address');
  }

  const existing = await NewsletterSubscriber.findOne({ email: normalized }).lean();
  const update = { email: normalized, source };

  if (preferencesInput) {
    update.preferences = await normalizeSubscriberPreferences(preferencesInput);
  }

  await NewsletterSubscriber.findOneAndUpdate({ email: normalized }, update, { upsert: true, new: true });

  if (!existing) {
    await emailService.send(
      normalized,
      'Thanks for joining the party!',
      emailWrap(
        'Wanna Party!',
        `<p>Thanks for subscribing to GigConnection party updates!</p>
       <p>We'll send you a <strong>weekly digest</strong> of upcoming parties near you that match your preferences.</p>
       <a href="${FRONTEND_URL}/parties" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">Browse parties</a>
       ${newsletterUnsubscribeFooter(normalized)}`
      ),
      `Thanks for joining the GigConnection party newsletter! Weekly digest of parties near you. Browse: ${FRONTEND_URL}/parties Unsubscribe: ${buildNewsletterUnsubscribeUrl(normalized)}`
    );
  }

  return { email: normalized, isNew: !existing };
}

/**
 * Grant parties access: subscribe if new, or refresh preferences if returning.
 */
export async function grantNewsletterAccess(email, source = 'parties', preferencesInput) {
  if (!preferencesInput) throw new Error('Preferences are required');
  return subscribeNewsletter(email, source, preferencesInput);
}

/**
 * Re-verify an existing subscriber (expired cookie) without sending welcome email again.
 */
export async function verifyExistingNewsletterSubscriber(email, preferencesInput = null) {
  const normalized = normalizeEmail(email);
  if (!normalized || !isValidEmail(normalized)) {
    throw new Error('Invalid email address');
  }

  const sub = await NewsletterSubscriber.findOne({ email: normalized });
  if (!sub) throw new Error('Email not on newsletter list');

  if (preferencesInput) {
    sub.preferences = await normalizeSubscriberPreferences(preferencesInput);
    await sub.save();
  }

  return { email: normalized };
}

export async function sendWeeklyDigestToSubscriber(subscriber, parties) {
  const matches = filterPartiesForSubscriber(parties, subscriber).slice(0, 8);
  if (!matches.length) return false;

  const locationLabel = subscriber.preferences?.locationLabel || 'your area';
  const cards = matches.map(buildDigestPartyHtml).join('');
  const subject = `Your weekly parties near ${locationLabel}`;
  const html = emailWrap(
    'Your weekly party picks',
    `<p>Hi! Here are upcoming live music parties matched to <strong>${locationLabel}</strong> and your preferences:</p>
     ${cards}
     <a href="${FRONTEND_URL}/parties" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin:8px 0;">Browse all parties</a>
     ${newsletterUnsubscribeFooter(subscriber.email)}`
  );
  const textLines = matches.map(
    (p) =>
      `- ${p.title} · ${formatPartyDate(p.date)} · ${p.musicianName} at ${p.venueName}`
  );
  const text = `Your weekly parties near ${locationLabel}:\n\n${textLines.join('\n')}\n\n${FRONTEND_URL}/parties\n\nUnsubscribe: ${buildNewsletterUnsubscribeUrl(subscriber.email)}`;

  await emailService.send(subscriber.email, subject, html, text);
  return true;
}

export async function runWeeklyNewsletterDigest() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - NEWSLETTER_DIGEST_INTERVAL_MS);

  const subscribers = await NewsletterSubscriber.find({
    'preferences.locationLabel': { $exists: true, $ne: '' },
    $or: [{ lastDigestSentAt: null }, { lastDigestSentAt: { $lte: cutoff } }],
  }).lean();

  if (!subscribers.length) return { sent: 0, skipped: 0 };

  const parties = await listUpcomingPartiesForDigest();
  let sent = 0;
  let skipped = 0;

  for (const subscriber of subscribers) {
    try {
      const didSend = await sendWeeklyDigestToSubscriber(subscriber, parties);
      if (didSend) {
        await NewsletterSubscriber.updateOne({ _id: subscriber._id }, { lastDigestSentAt: now });
        sent += 1;
      } else {
        skipped += 1;
      }
    } catch (err) {
      console.error(`[NewsletterDigest] Failed for ${subscriber.email}:`, err.message);
      skipped += 1;
    }
  }

  return { sent, skipped };
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

  return { email: normalized, accessRevoked: true };
}
