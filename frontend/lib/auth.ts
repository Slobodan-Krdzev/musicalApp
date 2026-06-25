const ACCESS_KEY = 'gigmatch_access';
const REFRESH_KEY = 'gigmatch_refresh';

export type User = {
  _id: string;
  email: string;
  role: 'MUSICIAN' | 'VENUE' | 'SUPERADMIN';
  isSuspended?: boolean;
  hasCompletedProfile?: boolean;
  isEmailVerified?: boolean;
};

export function setTokens(access: string, refresh: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
  if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
  return {
    accessToken: localStorage.getItem(ACCESS_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
  };
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getAccessToken(): string | null {
  return getStoredTokens().accessToken;
}

export function canAccessDashboard(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'SUPERADMIN') return false;
  if (user.role === 'MUSICIAN' || user.role === 'VENUE') {
    return !!user.hasCompletedProfile && !!user.isEmailVerified;
  }
  return false;
}

export function getPostAuthPath(user: User): string {
  if (user.role === 'SUPERADMIN') return '/admin';
  if (user.role === 'MUSICIAN' || user.role === 'VENUE') {
    if (!user.hasCompletedProfile) return '/profile';
    if (!user.isEmailVerified) return '/verify-email';
  }
  return '/dashboard';
}

/** After login, honor a safe redirect (e.g. /support) when the user may access it. */
export function resolvePostLoginPath(user: User, redirect?: string | null): string {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
    return getPostAuthPath(user);
  }

  const path = redirect.split('?')[0] || redirect;

  if (path === '/support' || path.startsWith('/support/')) {
    if (user.role === 'SUPERADMIN' || user.role === 'MUSICIAN' || user.role === 'VENUE') {
      return path;
    }
  }

  return getPostAuthPath(user);
}
