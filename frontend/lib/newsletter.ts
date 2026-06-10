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
): Promise<{ message: string; isNew?: boolean }> {
  const res = await apiRequest<{ message: string; isNew?: boolean }>('/api/newsletter/grant-access', {
    method: 'POST',
    body: JSON.stringify({ email, preferences }),
    token: null,
  });
  return { message: res.message, isNew: res.isNew };
}

export async function subscribeNewsletter(
  email: string,
  source: 'homepage' | 'parties' = 'homepage',
  preferences?: NewsletterPreferences
): Promise<{ message: string }> {
  const res = await apiRequest<{ message: string }>('/api/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email, source, preferences }),
    token: null,
  });
  return { message: res.message };
}

export async function verifyNewsletterAccess(
  email: string,
  preferences?: NewsletterPreferences
): Promise<{ message: string }> {
  const res = await apiRequest<{ message: string }>('/api/newsletter/verify', {
    method: 'POST',
    body: JSON.stringify({ email, preferences }),
    token: null,
  });
  return { message: res.message };
}
