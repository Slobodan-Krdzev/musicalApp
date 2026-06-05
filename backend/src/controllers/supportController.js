import {
  createSupportTicket,
  listUserSupportTickets,
  getUserSupportTicket,
} from '../services/supportService.js';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '../config/env.js';

export async function getSupportContact(req, res, next) {
  try {
    res.json({
      success: true,
      contact: {
        email: SUPPORT_EMAIL,
        phone: SUPPORT_PHONE || null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listMySupportTickets(req, res, next) {
  try {
    const tickets = await listUserSupportTickets(req.user._id);
    res.json({ success: true, tickets });
  } catch (err) {
    next(err);
  }
}

export async function createTicket(req, res, next) {
  try {
    const { subject, message } = req.validated;
    const ticket = await createSupportTicket({
      userId: req.user._id,
      subject,
      message,
    });
    res.status(201).json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
}

export async function getMySupportTicket(req, res, next) {
  try {
    const ticket = await getUserSupportTicket(req.user._id, req.params.id);
    res.json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
}
