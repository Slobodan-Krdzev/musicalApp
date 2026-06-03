'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';
import { BRAND, BrandMark } from '@/components/Layout/BrandMark';
import { MobileMenuShell, mobileNavLinkClass } from '@/components/Layout/MobileMenuShell';

type NavItem = { href: string; label: string; show: boolean };

export function Header() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const isInProfileWizard =
    pathname === '/profile' &&
    user &&
    (user.role === 'MUSICIAN' || user.role === 'VENUE') &&
    !user.hasCompletedProfile;

  const { data: notifsData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => apiRequest<{ unreadCount: number }>('/api/notifications?limit=1'),
    enabled: !!user && !isInProfileWizard,
    refetchInterval: 15000,
  });

  const unreadCount = notifsData?.unreadCount ?? 0;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = previousOverflow || '';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow || '';
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const navItems: NavItem[] = [
    { href: '/parties', label: 'Parties', show: true },
    { href: '/events', label: 'Events', show: user?.role === 'MUSICIAN' },
    { href: '/offerings', label: 'Offerings', show: user?.role === 'VENUE' },
    { href: '/dashboard', label: 'Dashboard', show: !!user && !isInProfileWizard },
    { href: '/admin', label: 'Admin', show: user?.role === 'SUPERADMIN' },
  ].filter((i) => i.show);

  const linkClass = (href: string) =>
    cn(
      'text-sm font-medium transition-colors',
      pathname === href ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-100'
    );

  const primaryButtonClass = cn(
    'inline-flex shrink-0 items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
    'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-zinc-50 hover:from-indigo-400 hover:to-fuchsia-400',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-950'
  );

  const ghostButtonClass = cn(
    'inline-flex shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 text-sm font-medium text-zinc-200 transition-colors',
    'hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950'
  );

  return (
    <>
      <header className="sticky top-0 z-[200] border-b border-zinc-800/60 bg-zinc-950/85 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 sm:px-4 lg:px-8">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none ring-offset-2 ring-offset-zinc-950 focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <BrandMark />
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-base font-bold tracking-tight text-zinc-50 sm:text-lg">
                {BRAND.name}
              </span>
              <span className="hidden truncate text-[11px] font-medium uppercase tracking-wide text-zinc-500 sm:block">
                Live music bookings
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                {item.label}
              </Link>
            ))}

            {!isLoading && user && !isInProfileWizard && (
              <Link href="/dashboard" className="relative -mx-1 px-1" aria-label="Notifications">
                <svg
                  className="h-5 w-5 text-zinc-400 transition-colors hover:text-zinc-100"
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
                  <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {!isLoading && user && (
              <span className="hidden max-w-[160px] truncate text-sm text-zinc-500 lg:inline">
                {user.email}
              </span>
            )}

            {!isLoading && (
              <>
                {user ? (
                  !isInProfileWizard && (
                    <button type="button" onClick={logout} className={ghostButtonClass}>
                      Log out
                    </button>
                  )
                ) : (
                  <>
                    <Link href="/login" className={ghostButtonClass}>
                      Log in
                    </Link>
                    <Link href="/register" className={primaryButtonClass}>
                      Sign up
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-2 md:hidden">
            {!isLoading && user && !isInProfileWizard && (
              <Link
                href="/dashboard"
                className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/80 text-zinc-200 transition-colors hover:bg-zinc-900"
                aria-label="Notifications"
              >
                <svg
                  className="h-5 w-5"
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
                  <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {!isLoading && !user && (
              <Link href="/register" className={primaryButtonClass}>
                Sign up
              </Link>
            )}

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/80 text-zinc-200 transition-colors hover:bg-zinc-900"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="auth-mobile-menu"
            >
              {open ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <MobileMenuShell open={open} onClose={() => setOpen(false)} id="auth-mobile-menu">
        {!isLoading && user && (
          <div className="mb-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Signed in as</p>
            <p className="mt-1 truncate text-sm font-medium text-zinc-200">{user.email}</p>
          </div>
        )}

        <nav className="flex flex-col gap-2.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={mobileNavLinkClass(pathname === item.href)}
            >
              <span>{item.label}</span>
              {item.href === '/dashboard' && unreadCount > 0 && (
                <span className="ml-auto rounded-full bg-violet-500 px-2 py-0.5 text-xs font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {!isLoading && (
          <div className="mt-5 flex flex-col gap-2.5 border-t border-zinc-800/70 pt-5">
            {user ? (
              !isInProfileWizard && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3.5 text-center text-base font-semibold text-red-300 transition-colors hover:bg-red-500/20"
                >
                  Log out
                </button>
              )
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className={mobileNavLinkClass(pathname === '/login')}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-3.5 text-center text-base font-semibold text-white transition-colors hover:from-indigo-400 hover:to-fuchsia-400"
                >
                  Sign up free
                </Link>
              </>
            )}
          </div>
        )}
      </MobileMenuShell>
    </>
  );
}
