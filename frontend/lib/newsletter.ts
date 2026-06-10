import { apiRequest } from '@/lib/api';

export type NewsletterPreferences = {
  locationLabel: string;
  latitude?: number | null;
  longitude?: number | null;
  locationPrecision?: 'typed' | 'gps';
  radiusKm?: number;
  genres?: string[];
};

export type NewsletterAccessStatus = {
  hasAccess: boolean;
  email?: string;
};

export type NewsletterSignupResult = {
  message: string;
  isNew?: boolean;
  needsVerification?: boolean;
  hasAccess?: boolean;
};

export async function checkNewsletterAccess(): Promise<NewsletterAccessStatus> {
  const res = await apiRequest<{ success: boolean; hasAccess: boolean; email?: string }>(
    '/api/newsletter/access',
    { token: null }
  );
  return { hasAccess: !!res.hasAccess, email: res.email };
}

export async function grantNewsletterAccess(
  email: string,
  preferences: NewsletterPreferences
): Promise<NewsletterSignupResult> {
  const res = await apiRequest<NewsletterSignupResult>('/api/newsletter/grant-access', {
    method: 'POST',
    body: JSON.stringify({ email, preferences }),
    token: null,
  });
  return {
    message: res.message,
    isNew: res.isNew,
    needsVerification: res.needsVerification,
    hasAccess: res.hasAccess,
  };
}

export async function subscribeNewsletter(
  email: string,
  source: 'homepage' | 'parties' = 'homepage',
  preferences?: NewsletterPreferences
): Promise<NewsletterSignupResult> {
  const res = await apiRequest<NewsletterSignupResult>('/api/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email, source, preferences }),
    token: null,
  });
  return {
    message: res.message,
    needsVerification: res.needsVerification,
    hasAccess: res.hasAccess,
  };
}

export async function verifyNewsletterAccess(
  email: string,
  preferences?: NewsletterPreferences
): Promise<NewsletterSignupResult> {
  const res = await apiRequest<NewsletterSignupResult>('/api/newsletter/verify', {
    method: 'POST',
    body: JSON.stringify({ email, preferences }),
    token: null,
  });
  return {
    message: res.message,
    needsVerification: res.needsVerification,
    hasAccess: res.hasAccess,
  };
}

export async function confirmNewsletterEmail(
  email: string,
  token: string
): Promise<{ message: string; hasAccess?: boolean }> {
  const params = new URLSearchParams({ email, token });
  const res = await apiRequest<{ message: string; hasAccess?: boolean }>(
    `/api/newsletter/confirm-email?${params.toString()}`,
    { token: null }
  );
  return { message: res.message, hasAccess: res.hasAccess };
}

export async function resendNewsletterVerification(email: string): Promise<{ message: string }> {
  const res = await apiRequest<{ message: string }>('/api/newsletter/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
    token: null,
  });
  return { message: res.message };
}

export async function unsubscribeNewsletter(
  email: string,
  token: string
): Promise<{ message: string; email?: string }> {
  const params = new URLSearchParams({ email, token });
  const res = await apiRequest<{ message: string; email?: string }>(
    `/api/newsletter/unsubscribe?${params.toString()}`,
    { token: null }
  );
  return { message: res.message, email: res.email };
}
