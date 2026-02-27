'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireRole?: 'MUSICIAN' | 'VENUE' | 'SUPERADMIN';
};

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (requireRole && user.role !== requireRole) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, requireRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return null;
  if (requireRole && user.role !== requireRole) return null;

  return <>{children}</>;
}
