'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireRole?: 'MUSICIAN' | 'VENUE' | 'SUPERADMIN';
  superAdminAllowed?: boolean;
};

export function ProtectedRoute({ children, requireRole, superAdminAllowed = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(loginUrl);
      return;
    }
    if (requireRole && user.role !== requireRole) {
      router.replace(user.role === 'SUPERADMIN' ? '/admin' : '/dashboard');
      return;
    }

    if (!requireRole && user.role === 'SUPERADMIN' && !superAdminAllowed) {
      router.replace('/admin');
      return;
    }
    const isProfileRoute = pathname === '/profile';
    const isVerifyRoute = pathname === '/verify-email';
    const isSupportRoute = pathname === '/support' || pathname.startsWith('/support/');

    if (
      (user.role === 'MUSICIAN' || user.role === 'VENUE') &&
      !user.hasCompletedProfile &&
      !isProfileRoute &&
      !isSupportRoute
    ) {
      router.replace('/profile');
      return;
    }

    if (
      (user.role === 'MUSICIAN' || user.role === 'VENUE') &&
      user.hasCompletedProfile &&
      !user.isEmailVerified &&
      !isProfileRoute &&
      !isVerifyRoute &&
      !isSupportRoute
    ) {
      router.replace('/verify-email');
    }
  }, [user, isLoading, requireRole, superAdminAllowed, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return null;
  if (requireRole && user.role !== requireRole) return null;

  const isMusicianOrVenue = user.role === 'MUSICIAN' || user.role === 'VENUE';
  const isSupportRoute = pathname === '/support' || pathname.startsWith('/support/');
  const blockedByProfile = isMusicianOrVenue && !user.hasCompletedProfile && pathname !== '/profile' && !isSupportRoute;
  const blockedByEmail =
    isMusicianOrVenue &&
    user.hasCompletedProfile &&
    !user.isEmailVerified &&
    pathname !== '/profile' &&
    pathname !== '/verify-email' &&
    !isSupportRoute;

  if (blockedByProfile || blockedByEmail) return null;

  return <>{children}</>;
}
