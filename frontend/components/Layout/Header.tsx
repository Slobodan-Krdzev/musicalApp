'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';

export function Header() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();

  const isInProfileWizard =
    pathname === '/profile' && user && (user.role === 'MUSICIAN' || user.role === 'VENUE') && !user.hasCompletedProfile;

  const { data: notifsData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => apiRequest<{ unreadCount: number }>('/api/notifications?limit=1'),
    enabled: !!user && !isInProfileWizard,
    refetchInterval: 30000,
  });

  const unreadCount = notifsData?.unreadCount ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-violet-400">
          GigConnection
        </Link>
        <nav className="flex items-center gap-5">
          {user?.role === 'MUSICIAN' && (
            <Link
              href="/events"
              className={`text-sm font-medium transition-colors ${pathname === '/events' ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-100'}`}
            >
              Events
            </Link>
          )}
          {user?.role === 'VENUE' && (
            <Link
              href="/offerings"
              className={`text-sm font-medium transition-colors ${pathname === '/offerings' ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-100'}`}
            >
              Offerings
            </Link>
          )}
          <Link
            href="/musicians"
            className={`text-sm font-medium transition-colors ${pathname === '/musicians' ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-100'}`}
          >
            Browse
          </Link>
          {!isLoading && (
            <>
              {user ? (
                <>
                  {!isInProfileWizard && (
                    <>
                      <Link
                        href="/dashboard"
                        className={`text-sm font-medium transition-colors ${pathname === '/dashboard' ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-100'}`}
                      >
                        Dashboard
                      </Link>

                      {/* Notification bell */}
                      <Link href="/dashboard" className="relative group">
                        <svg
                          className="w-5 h-5 text-zinc-400 group-hover:text-zinc-100 transition-colors"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                          />
                        </svg>
                        {unreadCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-violet-500 text-white text-[10px] font-bold animate-in zoom-in duration-200">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </Link>
                    </>
                  )}
                  {user.role === 'SUPERADMIN' && (
                    <Link
                      href="/admin"
                      className={`text-sm font-medium transition-colors ${pathname === '/admin' ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-100'}`}
                    >
                      Admin
                    </Link>
                  )}
                  <span className="text-zinc-500 text-sm hidden md:inline">{user.email}</span>
                  {!isInProfileWizard && (
                    <Button variant="ghost" size="sm" onClick={logout}>
                      Log out
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Log in</Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">Sign up</Button>
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
