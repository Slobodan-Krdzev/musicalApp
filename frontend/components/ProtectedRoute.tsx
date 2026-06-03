'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireRole?: 'MUSICIAN' | 'VENUE' | 'SUPERADMIN';
};

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (requireRole && user.role !== requireRole) {
      router.replace('/dashboard');
      return;
    }
    const isProfileRoute = pathname === '/profile';
    const isVerifyRoute = pathname === '/verify-email';

    if (
      (user.role === 'MUSICIAN' || user.role === 'VENUE') &&
      !user.hasCompletedProfile &&
      !isProfileRoute
    ) {
      router.replace('/profile');
      return;
    }

    if (
      (user.role === 'MUSICIAN' || user.role === 'VENUE') &&
      user.hasCompletedProfile &&
      !user.isEmailVerified &&
      !isProfileRoute &&
      !isVerifyRoute
    ) {
      router.replace('/verify-email');
    }
  }, [user, isLoading, requireRole, router, pathname]);

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
  const blockedByProfile = isMusicianOrVenue && !user.hasCompletedProfile && pathname !== '/profile';
  const blockedByEmail =
    isMusicianOrVenue &&
    user.hasCompletedProfile &&
    !user.isEmailVerified &&
    pathname !== '/profile' &&
    pathname !== '/verify-email';

  if (blockedByProfile || blockedByEmail) return null;

  return <>{children}</>;
}
