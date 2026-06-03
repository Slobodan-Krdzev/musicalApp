import {
  Application,
  DealMessage,
  DealChatReadState,
  Event,
  Offering,
  MusicianProfile,
  VenueProfile,
  User,
} from '../models/index.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors.js';
import { createNotification } from './notificationService.js';
import { FRONTEND_URL } from '../config/env.js';

function emailWrap(title, body) {
  return `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;"><h2 style="color:#7c3aed;">${title}</h2>${body}</div>`;
}

function chatLink(applicationId) {
  return `${FRONTEND_URL}/applications/${applicationId}/finalize?chat=1`;
}

function ctaButton(label, href) {
  return `<a href="${href}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">${label}</a>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function assertChatAccess(applicationId, userId) {
  const app = await Application.findById(applicationId);
  if (!app) throw new NotFoundError('Application not found');
  if (app.status !== 'FINALIZED') {
    throw new ForbiddenError('Chat is only available for finalized deals');
  }

  const uid = userId.toString();
  if (app.applicantId.toString() !== uid && app.ownerId.toString() !== uid) {
    throw new ForbiddenError('Not authorized');
  }

  return app;
}

export function getRecipientId(app, senderId) {
  const sid = senderId.toString();
  return sid === app.applicantId.toString() ? app.ownerId : app.applicantId;
}

async function getPartnerLastReadAt(app, userId) {
  const partnerId = getRecipientId(app, userId);
  const state = await DealChatReadState.findOne({ applicationId: app._id, userId: partnerId })
    .select('lastReadAt')
    .lean();
  if (!state?.lastReadAt) return null;
  return state.lastReadAt instanceof Date ? state.lastReadAt.toISOString() : state.lastReadAt;
}

export async function markDealChatRead({ applicationId, userId, io }) {
  const app = await assertChatAccess(applicationId, userId);
  const now = new Date();

  const state = await DealChatReadState.findOneAndUpdate(
    { applicationId: app._id, userId },
    { lastReadAt: now },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const payload = {
    applicationId: app._id.toString(),
    userId: userId.toString(),
    lastReadAt: state.lastReadAt.toISOString(),
  };

  if (io) {
    io.to(`deal-chat:${applicationId}`).emit('deal_chat:seen', payload);
  }

  return payload;
}

export async function listDealMessages(applicationId, userId) {
  const app = await assertChatAccess(applicationId, userId);

  const [messages, partnerLastReadAt] = await Promise.all([
    DealMessage.find({ applicationId: app._id }).sort({ createdAt: 1 }).lean(),
    getPartnerLastReadAt(app, userId),
  ]);

  return {
    messages: messages.map((m) => ({
      id: m._id.toString(),
      applicationId: m.applicationId.toString(),
      senderId: m.senderId.toString(),
      body: m.body,
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
    })),
    partnerLastReadAt,
  };
}

async function resolveSenderName(app, senderId) {
  const isApplicant = senderId.toString() === app.applicantId.toString();

  if (app.entityType === 'EVENT') {
    if (isApplicant) {
      const profile = await MusicianProfile.findOne({ userId: senderId }).select('bandName').lean();
      return profile?.bandName || 'Musician';
    }
    const profile = await VenueProfile.findOne({ userId: senderId }).select('venueName').lean();
    return profile?.venueName || 'Venue';
  }

  if (isApplicant) {
    const profile = await VenueProfile.findOne({ userId: senderId }).select('venueName').lean();
    return profile?.venueName || 'Venue';
  }
  const profile = await MusicianProfile.findOne({ userId: senderId }).select('bandName').lean();
  return profile?.bandName || 'Musician';
}

async function resolveEntityTitle(app) {
  if (app.entityType === 'EVENT') {
    const event = await Event.findById(app.entityId).select('title').lean();
    return event?.title || 'your deal';
  }
  const offering = await Offering.findById(app.entityId).select('title').lean();
  return offering?.title || 'your deal';
}

export async function sendDealMessage({ applicationId, senderId, body, io }) {
  const trimmed = body?.trim();
  if (!trimmed) throw new ValidationError('Message cannot be empty');
  if (trimmed.length > 2000) throw new ValidationError('Message too long');

  const app = await assertChatAccess(applicationId, senderId);
  const recipientId = getRecipientId(app, senderId);

  const message = await DealMessage.create({
    applicationId,
    senderId,
    body: trimmed,
  });

  const payload = {
    id: message._id.toString(),
    applicationId: applicationId.toString(),
    senderId: senderId.toString(),
    body: trimmed,
    createdAt: message.createdAt.toISOString(),
  };

  const [senderName, entityTitle] = await Promise.all([
    resolveSenderName(app, senderId),
    resolveEntityTitle(app),
  ]);

  const recipient = await User.findById(recipientId).select('email').lean();
  const preview = trimmed.length > 280 ? `${trimmed.slice(0, 277)}…` : trimmed;
  const notifMessage = `${senderName} sent you a message about "${entityTitle}".`;
  const chatUrl = chatLink(applicationId);

  await createNotification({
    userId: recipientId,
    type: 'DEAL_CHAT_MESSAGE',
    message: notifMessage,
    relatedEntityId: applicationId,
    relatedEntityModel: 'Application',
    sendEmail: !!recipient?.email,
    emailAddress: recipient?.email,
    emailSubject: `New message from ${senderName}: ${entityTitle}`,
    emailBody: emailWrap('New deal chat message', `
      <p><strong>${escapeHtml(senderName)}</strong> sent you a message about "<strong>${escapeHtml(entityTitle)}</strong>":</p>
      <blockquote style="margin:16px 0;padding:12px 16px;border-left:4px solid #7c3aed;background:#f4f4f5;color:#27272a;">${escapeHtml(preview)}</blockquote>
      <p>Reply on the deal page to keep coordinating your gig.</p>
      ${ctaButton('Open Chat', chatUrl)}
    `),
  });

  if (io) {
    io.to(`deal-chat:${applicationId}`).emit('deal_chat:message', payload);
    io.to(`user:${recipientId}`).emit('notification:new');
  }

  return payload;
}
