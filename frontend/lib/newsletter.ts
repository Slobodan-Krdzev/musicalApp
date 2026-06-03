import { apiRequest } from '@/lib/api';

export async function subscribeNewsletter(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/api/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email }),
    token: null,
  });
}
