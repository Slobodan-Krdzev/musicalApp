import { User } from '../models/index.js';
import { createNotification } from './notificationService.js';
import { FRONTEND_URL } from '../config/env.js';

/**
 * Centralized subscription email + in-app notifications.
 * Shared by the Stripe webhook/service (activation, renewal, cancellation) and the
 * subscription scheduler (expiry reminders), so wording and styling stay consistent (DRY).
 */

function emailWrap(title, body) {
  return `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;"><h2 style="color:#7c3aed;">${title}</h2>${body}</div>`;
}

function ctaButton(label, path = '/dashboard?tab=subscription') {
  return `<a href="${FRONTEND_URL}${path}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">${label}</a>`;
}

function planLabel(planId) {
  if (planId === 'free_pass') return 'Free Pass';
  return String(planId || 'subscription').replace('_', ' ');
}

function noteBlock(note, label = 'Message from the team') {
  if (!note?.trim()) return '';
  return `<blockquote style="margin:16px 0;padding:12px 16px;border-left:4px solid #7c3aed;background:#f5f3ff;color:#374151;">${label}: ${note.trim()}</blockquote>`;
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

async function dispatch(sub, { type, message, subject, title, body }) {
  const user = await User.findById(sub.userId).select('email').lean();
  await createNotification({
    userId: sub.userId,
    type,
    message,
    sendEmail: !!user?.email,
    emailAddress: user?.email,
    emailSubject: subject,
    emailBody: emailWrap(title, body),
  });
}

/** First activation of a paid subscription. */
export async function notifySubscriptionStarted(sub) {
  const end = sub.currentPeriodEnd ? ` Your next billing date is ${formatDate(sub.currentPeriodEnd)}.` : '';
  const message = `Your ${planLabel(sub.planId)} subscription is now active.${end}`;
  await dispatch(sub, {
    type: 'SUBSCRIPTION_STARTED',
    message,
    subject: 'Your subscription is active',
    title: 'Subscription Activated',
    body: `<p>${message}</p><p>Thank you for subscribing — you now have full access.</p>${ctaButton('Go to Dashboard', '/dashboard')}`,
  });
}

/** Successful auto-renewal (new billing cycle paid). */
export async function notifyRenewed(sub) {
  const message = `Your ${planLabel(sub.planId)} subscription renewed successfully. Next billing date: ${formatDate(
    sub.currentPeriodEnd
  )}.`;
  await dispatch(sub, {
    type: 'SUBSCRIPTION_RENEWED',
    message,
    subject: 'Your subscription renewed',
    title: 'Subscription Renewed',
    body: `<p>${message}</p>${ctaButton('View Billing', '/dashboard?tab=subscription')}`,
  });
}

/** User cancelled (cancel at period end). */
export async function notifyCanceled(sub) {
  const endStr = formatDate(sub.currentPeriodEnd);
  const message = endStr
    ? `Your ${planLabel(sub.planId)} subscription has been cancelled. You'll keep access until ${endStr}, after which it won't renew.`
    : `Your ${planLabel(sub.planId)} subscription has been cancelled and won't renew.`;
  await dispatch(sub, {
    type: 'SUBSCRIPTION_CANCELED',
    message,
    subject: 'Your subscription has been cancelled',
    title: 'Subscription Cancelled',
    body: `<p>${message}</p><p>Changed your mind? You can resume anytime before it ends.</p>${ctaButton(
      'Resume Subscription'
    )}`,
  });
}

/** 7-day / 1-day pre-expiry reminder. Wording adapts to trial / auto-renew / lapsing. */
export async function notifyExpiringReminder(sub, days) {
  const when = days === 1 ? 'tomorrow' : `in ${days} days`;
  const endStr = formatDate(sub.currentPeriodEnd);
  const isTrial = sub.planId === 'free_trial';
  const isFreePass = sub.planId === 'free_pass' || sub.freePassActive;
  const autoRenews = !!sub.stripeSubscriptionId && !sub.cancelAtPeriodEnd && !isTrial && !isFreePass;

  let message;
  let subject;
  let title;
  let body;

  if (isFreePass) {
    message = `Your Free Pass ends ${when} (${endStr}).`;
    subject = `Your Free Pass ends ${when}`;
    title = 'Free Pass Ending Soon';
    body = `<p>${message}</p>${noteBlock(sub.adminNote)}${ctaButton('View Subscription', '/dashboard?tab=subscription')}`;
  } else if (autoRenews) {
    message = `Your ${planLabel(sub.planId)} plan renews ${when} (${endStr}). Your saved card will be charged automatically — no action needed.`;
    subject = `Your subscription renews ${when}`;
    title = 'Upcoming Renewal';
    body = `<p>${message}</p>${ctaButton('Manage Subscription')}`;
  } else if (isTrial) {
    message = `Your free trial ends ${when} (${endStr}). Subscribe now to keep full access.`;
    subject = `Your free trial ends ${when}`;
    title = 'Free Trial Ending';
    body = `<p>${message}</p>${ctaButton('Choose a Plan')}`;
  } else {
    message = `Your ${planLabel(sub.planId)} plan ends ${when} (${endStr}). Renew now to keep full access.`;
    subject = `Your subscription ends ${when}`;
    title = 'Subscription Ending Soon';
    body = `<p>${message}</p>${ctaButton('Renew Subscription')}`;
  }

  await dispatch(sub, { type: 'SUBSCRIPTION_EXPIRING', message, subject, title, body });
}

/** Subscription has fully lapsed. */
export async function notifyExpired(sub) {
  const isFreePass = sub.planId === 'free_pass' || sub.freePassActive;
  const message = isFreePass
    ? 'Your Free Pass has ended. Subscribe to continue creating listings and applying.'
    : `Your ${planLabel(sub.planId)} subscription has ended. Renew to continue creating listings and applying.`;
  await dispatch(sub, {
    type: 'SUBSCRIPTION_EXPIRED',
    message,
    subject: isFreePass ? 'Your Free Pass has ended' : 'Your subscription has ended',
    title: isFreePass ? 'Free Pass Ended' : 'Subscription Ended',
    body: `<p>${message}</p>${noteBlock(sub.adminNote)}${ctaButton(isFreePass ? 'Choose a Plan' : 'Renew Subscription')}`,
  });
}

/** Admin granted a Free Pass. */
export async function notifyFreePassGranted(sub, { stripeCanceled = false, note = null } = {}) {
  const endStr = formatDate(sub.currentPeriodEnd);
  const billingLine = stripeCanceled
    ? ' Your paid subscription has been stopped — you will not be charged while your Free Pass is active.'
    : '';
  const message = `You have been granted a Free Pass until ${endStr}.${billingLine}`;
  await dispatch(sub, {
    type: 'FREE_PASS_GRANTED',
    message: note ? `${message} Note: ${note}` : message,
    subject: 'You received a Free Pass',
    title: 'Free Pass Activated',
    body: `<p>${message}</p>${noteBlock(note)}${ctaButton('Go to Dashboard', '/dashboard?tab=subscription')}`,
  });
}

/** Admin revoked a Free Pass early. */
export async function notifyFreePassRevoked(sub, { note = null, grantNote = null } = {}) {
  const message = note
    ? 'Your Free Pass has been removed by an administrator.'
    : 'Your Free Pass has been removed by an administrator. Subscribe to restore full access.';
  await dispatch(sub, {
    type: 'FREE_PASS_REVOKED',
    message: note ? `${message} ${note}` : message,
    subject: 'Your Free Pass has ended',
    title: 'Free Pass Removed',
    body: `<p>${message}</p>${noteBlock(note, 'Message from the team')}${noteBlock(grantNote, 'Previous note')}${ctaButton('Choose a Plan', '/dashboard?tab=subscription')}`,
  });
}
