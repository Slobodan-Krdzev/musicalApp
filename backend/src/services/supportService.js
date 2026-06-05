import { SupportTicket, User, ROLES } from '../models/index.js';
import { createNotification } from './notificationService.js';
import { emailService } from './emailService.js';
import { FRONTEND_URL, SUPPORT_EMAIL } from '../config/env.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

function generateTicketNumber() {
  return `GC-${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

function emailWrap(title, body) {
  return `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;"><h2 style="color:#7c3aed;">${title}</h2>${body}</div>`;
}

function ctaButton(href, label) {
  return `<a href="${href}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">${label}</a>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function notifySuperAdmins({ type, message, ticketId, emailSubject, emailBody }) {
  const admins = await User.find({ role: ROLES.SUPERADMIN }).select('_id').lean();
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin._id,
        type,
        message,
        relatedEntityId: ticketId,
        relatedEntityModel: 'SupportTicket',
      })
    )
  );
  await emailService.send(SUPPORT_EMAIL, emailSubject, emailBody, message);
}

export async function createSupportTicket({ userId, subject, message }) {
  const user = await User.findById(userId).select('email role').lean();
  if (!user) throw new NotFoundError('User not found');

  const ticket = await SupportTicket.create({
    ticketNumber: generateTicketNumber(),
    userId,
    subject,
    message,
    status: 'PENDING',
  });

  const userMessage = `Your support ticket ${ticket.ticketNumber} was received. We'll get back to you soon.`;
  await createNotification({
    userId,
    type: 'SUPPORT_TICKET_CREATED',
    message: userMessage,
    relatedEntityId: ticket._id,
    relatedEntityModel: 'SupportTicket',
    sendEmail: true,
    emailAddress: user.email,
    emailSubject: `Support ticket received — ${ticket.ticketNumber}`,
    emailBody: emailWrap(
      'We received your request',
      `<p>Hi,</p><p>Your support ticket <strong>${escapeHtml(ticket.ticketNumber)}</strong> has been submitted.</p><p><strong>Subject:</strong> ${escapeHtml(subject)}</p><p>Our team will review it and respond as soon as possible.</p>${ctaButton(`${FRONTEND_URL}/support`, 'View your tickets')}`
    ),
  });

  const adminMessage = `New support ticket ${ticket.ticketNumber} from ${user.email}: ${subject}`;
  const adminEmailBody = emailWrap(
    'New support ticket',
    `<p><strong>Ticket:</strong> ${escapeHtml(ticket.ticketNumber)}</p><p><strong>From:</strong> ${escapeHtml(user.email)} (${user.role})</p><p><strong>Subject:</strong> ${escapeHtml(subject)}</p><p><strong>Message:</strong></p><p style="white-space:pre-wrap;background:#18181b;padding:12px;border-radius:8px;">${escapeHtml(message)}</p>${ctaButton(`${FRONTEND_URL}/admin`, 'Open admin dashboard')}`
  );

  await notifySuperAdmins({
    type: 'SUPPORT_TICKET_RECEIVED',
    message: adminMessage,
    ticketId: ticket._id,
    emailSubject: `New support ticket — ${ticket.ticketNumber}`,
    emailBody: adminEmailBody,
  });

  return ticket;
}

export async function listUserSupportTickets(userId) {
  return SupportTicket.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function getUserSupportTicket(userId, ticketId) {
  const ticket = await SupportTicket.findById(ticketId).lean();
  if (!ticket) throw new NotFoundError('Ticket not found');
  if (ticket.userId.toString() !== userId.toString()) throw new ForbiddenError('Access denied');
  return ticket;
}

export async function listSupportTicketsAdmin({ status, q, page = 1, limit = 25 }) {
  const filter = {};
  if (status && status !== 'ALL') filter.status = status;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 25));
  const skip = (pageNum - 1) * limitNum;

  let tickets;
  let total;

  if (q && q.trim()) {
    const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const users = await User.find({ email: regex }).select('_id').lean();
    const userIds = users.map((u) => u._id);
    filter.$or = [
      { subject: regex },
      { message: regex },
      { ticketNumber: regex },
      ...(userIds.length ? [{ userId: { $in: userIds } }] : []),
    ];
  }

  [tickets, total] = await Promise.all([
    SupportTicket.find(filter)
      .populate('userId', 'email role')
      .populate('resolvedBy', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    SupportTicket.countDocuments(filter),
  ]);

  const pendingCount = await SupportTicket.countDocuments({ status: 'PENDING' });

  return {
    tickets,
    pendingCount,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  };
}

export async function getSupportTicketAdmin(ticketId) {
  const ticket = await SupportTicket.findById(ticketId)
    .populate('userId', 'email role')
    .populate('resolvedBy', 'email')
    .lean();
  if (!ticket) throw new NotFoundError('Ticket not found');
  return ticket;
}

export async function updateSupportTicketAdmin({ ticketId, status, adminNote, adminId }) {
  const ticket = await SupportTicket.findById(ticketId).populate('userId', 'email').lean();
  if (!ticket) throw new NotFoundError('Ticket not found');

  const previousStatus = ticket.status;
  const update = { status };
  if (adminNote !== undefined) update.adminNote = adminNote;
  if (status === 'RESOLVED' || status === 'CLOSED') {
    update.resolvedAt = new Date();
    update.resolvedBy = adminId;
  } else {
    update.resolvedAt = null;
    update.resolvedBy = null;
  }

  const updated = await SupportTicket.findByIdAndUpdate(ticketId, update, { new: true })
    .populate('userId', 'email role')
    .populate('resolvedBy', 'email')
    .lean();

  const userEmail = ticket.userId?.email;
  const userId = ticket.userId?._id || ticket.userId;

  if (previousStatus !== status && userId) {
    const statusLabel = status.replace(/_/g, ' ').toLowerCase();
    const userMessage = `Your support ticket ${ticket.ticketNumber} is now ${statusLabel}.`;
    const isResolved = status === 'RESOLVED' || status === 'CLOSED';
    const notificationType = isResolved ? 'SUPPORT_TICKET_RESOLVED' : 'SUPPORT_TICKET_UPDATED';

    await createNotification({
      userId,
      type: notificationType,
      message: userMessage,
      relatedEntityId: ticket._id,
      relatedEntityModel: 'SupportTicket',
      sendEmail: true,
      emailAddress: userEmail,
      emailSubject: isResolved
        ? `Support ticket ${ticket.ticketNumber} resolved`
        : `Support ticket ${ticket.ticketNumber} updated`,
      emailBody: emailWrap(
        isResolved ? 'Ticket resolved' : 'Ticket updated',
        `<p>Your support ticket <strong>${escapeHtml(ticket.ticketNumber)}</strong> (${escapeHtml(ticket.subject)}) is now <strong>${escapeHtml(statusLabel)}</strong>.</p>${adminNote ? `<p><strong>Note from support:</strong></p><p style="white-space:pre-wrap;background:#18181b;padding:12px;border-radius:8px;">${escapeHtml(adminNote)}</p>` : ''}${ctaButton(`${FRONTEND_URL}/support`, 'View your tickets')}`
      ),
    });
  }

  return updated;
}

export async function countPendingSupportTickets() {
  return SupportTicket.countDocuments({ status: { $in: ['PENDING', 'IN_PROGRESS'] } });
}
