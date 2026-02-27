/**
 * Email service abstraction - mock implementation.
 * Replace with SendGrid, SES, etc. in production.
 */
export const emailService = {
  async send(to, subject, html, text) {
    console.log('[Email Mock]', { to, subject, text: text?.slice(0, 80) });
    return { ok: true };
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
