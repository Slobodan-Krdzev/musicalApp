/**
 * API client: uses Next.js rewrite /api -> backend. Attach Bearer token when available.
 */

function getBaseUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

export type ApiResponse<T> = { success: true; [k: string]: T | boolean | undefined } | { success: false; error: string };

/** Get access token for authenticated requests (client-side only) */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('gigmatch_access');
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string>; token?: string | null } = {}
): Promise<T> {
  const { params, token, ...init } = options;
  const base = getBaseUrl();
  const url = new URL(path.startsWith('http') ? path : path.startsWith('/') ? `${base}${path}` : `${base}/${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const access = token !== undefined ? token : getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (access) headers.Authorization = `Bearer ${access}`;

  const res = await fetch(url.toString(), { ...init, headers, credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || res.statusText || 'Request failed');
  return data as T;
}
