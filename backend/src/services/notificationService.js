import { Notification } from '../models/index.js';
import { emailService } from './emailService.js';

/**
 * Create in-app notification and optionally send email.
 */
export async function createNotification({
  userId,
  type,
  message,
  relatedEntityId = null,
  relatedEntityModel = null,
  sendEmail = false,
  emailAddress = null,
  emailSubject = null,
  emailBody = null,
}) {
  const notification = await Notification.create({
    userId,
    type,
    message,
    relatedEntityId,
    relatedEntityModel,
  });
  if (sendEmail && emailAddress) {
    await emailService.send(emailAddress, emailSubject || 'Notification', emailBody || message, message);
  }
  return notification;
}
