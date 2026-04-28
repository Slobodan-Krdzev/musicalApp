import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { EMAIL_FROM, FRONTEND_URL, RESEND_API_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } from '../config/env.js';

let transporter = null;
let resendClient = null;

function getResendClient() {
  if (resendClient) return resendClient;
  if (!RESEND_API_KEY) return null;
  resendClient = new Resend(RESEND_API_KEY);
  console.log('[Email] Resend configured');
  return resendClient;
}

function getTransporter() {
  if (transporter) return transporter;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    console.log(`[Email] SMTP configured → ${SMTP_HOST}:${SMTP_PORT} as ${SMTP_USER}`);
  } else {
    transporter = {
      async sendMail(opts) {
        console.log('[Email Mock] To:', opts.to);
        console.log('[Email Mock] Subject:', opts.subject);
        console.log('[Email Mock] Text:', opts.text?.slice(0, 200));
        return { messageId: `mock-${Date.now()}` };
      },
    };
    console.log('[Email] No email provider configured – using mock transport (emails logged to console)');
  }

  return transporter;
}

export const emailService = {
  async send(to, subject, html, text) {
    try {
      const resend = getResendClient();
      if (resend) {
        const { data, error } = await resend.emails.send({
          from: EMAIL_FROM,
          to,
          subject,
          html,
          text,
        });
        if (error) {
          console.error(`[Email] Failed to send "${subject}" to ${to}:`, error);
          throw new Error(error.message || 'Resend send failed');
        }
        console.log(`[Email] Sent "${subject}" to ${to} (${data?.id || 'resend'})`);
        return { ok: true, messageId: data?.id || null };
      }

      const t = getTransporter();
      const result = await t.sendMail({ from: SMTP_FROM, to, subject, html, text });
      console.log(`[Email] Sent "${subject}" to ${to} (${result.messageId})`);
      return { ok: true, messageId: result.messageId };
    } catch (err) {
      console.error(`[Email] Failed to send "${subject}" to ${to}:`, err.message);
      throw err;
    }
  },

  async sendVerificationEmail(to, token) {
    const url = `${FRONTEND_URL}/verify-email?token=${token}`;
    return this.send(
      to,
      'Verify your GigConnection email',
      `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">Welcome to GigConnection!</h2>
          <p>Please verify your email address to start using the app.</p>
          <a href="${url}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
            Verify Email
          </a>
          <p style="color:#888;font-size:13px;">Or copy this link: ${url}</p>
          <p style="color:#888;font-size:13px;">This link expires in 24 hours.</p>
        </div>
      `,
      `Verify your email: ${url}`
    );
  },

  async sendProfileVerifiedEmail(to, name) {
    return this.send(
      to,
      'Your GigConnection profile is verified!',
      `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">Profile Verified!</h2>
          <p>Hey ${name || 'there'},</p>
          <p>Your profile has been verified and is now live on GigConnection. You can start browsing and connecting!</p>
          <a href="${FRONTEND_URL}/dashboard" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
            Go to Dashboard
          </a>
        </div>
      `,
      `Your GigConnection profile is verified! Visit ${FRONTEND_URL}/dashboard`
    );
  },

  async sendApplicationReceived(venueEmail, musicianName, eventTitle) {
    return this.send(
      venueEmail,
      `New application: ${eventTitle}`,
      `<p>${musicianName} applied to your event "${eventTitle}".</p>`,
      `${musicianName} applied to "${eventTitle}".`
    );
  },

  async sendApplicationAccepted(musicianEmail, venueName, eventTitle) {
    return this.send(
      musicianEmail,
      `Application accepted: ${eventTitle}`,
      `<p>${venueName} accepted your application for "${eventTitle}".</p>`,
      `Your application for "${eventTitle}" was accepted by ${venueName}.`
    );
  },

  async sendApplicationRejected(musicianEmail, venueName, eventTitle) {
    return this.send(
      musicianEmail,
      `Application update: ${eventTitle}`,
      `<p>${venueName} has declined your application for "${eventTitle}".</p>`,
      `Your application for "${eventTitle}" was declined.`
    );
  },

  async sendSubscriptionExpiring(userEmail, planId, endDate) {
    return this.send(
      userEmail,
      'Your subscription is ending soon',
      `<p>Your ${planId} subscription ends on ${endDate}. Renew to keep access.</p>`,
      `Subscription ends on ${endDate}.`
    );
  },
};
