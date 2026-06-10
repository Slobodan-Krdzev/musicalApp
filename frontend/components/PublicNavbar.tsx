'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/hooks/useAuth';
import { canAccessDashboard } from '@/lib/auth';
import { BRAND, BrandMark } from '@/components/Layout/BrandMark';
import { MobileMenuShell, mobileNavLinkClass } from '@/components/Layout/MobileMenuShell';

const primaryNavLinkClassName = cn(
  'inline-flex shrink-0 items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-950',
  'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-zinc-50 hover:from-indigo-400 hover:to-fuchsia-400'
);

type PublicNavbarProps = {
  brandText?: string;
};

/** Matches `h-16` on the navbar bar — used for fixed offset (e.g. legal page). */
export const PUBLIC_NAVBAR_HEIGHT_PX = 64;

export function PublicNavbar({ brandText = BRAND.name }: PublicNavbarProps) {
  const { user, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.documentElement.style.setProperty('--public-navbar-height', `${PUBLIC_NAVBAR_HEIGHT_PX}px`);
    return () => {
      document.documentElement.style.removeProperty('--public-navbar-height');
    };
  }, []);

  const showDashboard = canAccessDashboard(user);
  const showAuthLinks = mounted && !isLoading && (!user || !showDashboard);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    if (open) document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow || '';
    };
  }, [open]);

  const primaryHref = showDashboard ? '/dashboard' : '/register';
  const primaryText = showDashboard ? 'Dashboard' : 'Get Started';

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none ring-offset-2 ring-offset-zinc-950 focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <BrandMark />
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-bold tracking-tight text-zinc-100 sm:text-base">
                {brandText}
              </span>
              <span className="hidden truncate text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:block">
                Live music bookings
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-4 text-sm lg:flex">
            <Link href="/parties" className="text-zinc-400 hover:text-zinc-100">
              Parties
            </Link>
            <Link href="/about" className="text-zinc-400 hover:text-zinc-100">
              About Us
            </Link>
            {showAuthLinks && (
              <Link href="/login" className="text-zinc-400 hover:text-zinc-100">
                Log in
              </Link>
            )}
            {(!user || showDashboard) && (
              <Link href={primaryHref} className={primaryNavLinkClassName}>
                {primaryText}
              </Link>
            )}
            {showAuthLinks && user && !showDashboard && (
              <Link href="/register" className={primaryNavLinkClassName}>
                Sign up
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            {(!user || showDashboard) && (
              <Link href={primaryHref} className={primaryNavLinkClassName}>
                {primaryText}
              </Link>
            )}
            {showAuthLinks && user && !showDashboard && (
              <Link href="/register" className={primaryNavLinkClassName}>
                Sign up
              </Link>
            )}

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/40 text-zinc-200 transition-colors hover:bg-zinc-900/60"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="public-mobile-menu"
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

      {/* Reserve space in document flow for the fixed navbar */}
      <div className="h-16 shrink-0" aria-hidden />

      <MobileMenuShell
        open={open}
        onClose={() => setOpen(false)}
        id="public-mobile-menu"
        breakpoint="lg"
      >
        <nav className="flex flex-col gap-2.5">
          <Link
            href="/parties"
            onClick={() => setOpen(false)}
            className={mobileNavLinkClass(false)}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </span>
            <span>
              <span className="block">Parties</span>
              <span className="block text-xs font-normal text-zinc-500">Find live shows near you</span>
            </span>
          </Link>
          <Link
            href="/about"
            onClick={() => setOpen(false)}
            className={mobileNavLinkClass(false)}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </span>
            <span>
              <span className="block">About Us</span>
              <span className="block text-xs font-normal text-zinc-500">Our mission & story</span>
            </span>
          </Link>
          {showDashboard && user && (
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className={mobileNavLinkClass(false)}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/15 text-fuchsia-300">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </span>
              <span>
                <span className="block">Dashboard</span>
                <span className="block text-xs font-normal text-zinc-500">Manage your gigs</span>
              </span>
            </Link>
          )}
        </nav>

        {showAuthLinks && (
          <div className="mt-5 flex flex-col gap-2.5 border-t border-zinc-800/70 pt-5">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className={mobileNavLinkClass(false)}
            >
              Log in
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-3.5 text-center text-base font-semibold text-white transition-colors hover:from-indigo-400 hover:to-fuchsia-400"
            >
              {user && !showDashboard ? 'Sign up' : 'Get started free'}
            </Link>
          </div>
        )}

        <p className="mt-8 text-center text-[11px] font-medium uppercase tracking-widest text-zinc-600">
          Built for live music
        </p>
      </MobileMenuShell>
    </>
  );
}
