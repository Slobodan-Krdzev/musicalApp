'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { useAuth } from '@/hooks/useAuth';

/** Anchor styled like nav primary CTA (avoid `<a><button>` — invalid and breaks navigation). */
const primaryNavLinkClassName = cn(
  'inline-flex shrink-0 items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-950',
  'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-zinc-50 hover:from-indigo-400 hover:to-fuchsia-400'
);

type PublicNavbarProps = {
  brandText?: string;
};

export function PublicNavbar({ brandText = 'GigConnection' }: PublicNavbarProps) {
  const { user, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    if (open) document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open]);

  const primaryHref = user ? '/dashboard' : '/register';
  const primaryText = user ? 'Dashboard' : 'Get Started';

  const mobileMenu = useMemo(() => {
    if (!open || !mounted) return null;
    return createPortal(
      <div className="fixed inset-0 z-[10000] lg:hidden h-[100dvh]">
        <div className="absolute inset-0 bg-zinc-950" onClick={() => setOpen(false)} aria-hidden />
        <div className="relative z-[1] flex h-full w-full items-center justify-center px-6 pointer-events-none">
          <div className="absolute right-4 top-4 pointer-events-auto">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/60 text-zinc-200 hover:bg-zinc-900/60 transition-colors"
              aria-label="Close menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <nav className="pointer-events-auto flex w-full max-w-sm flex-col items-center gap-4 text-center">
            <Link
              href="/about"
              onClick={() => setOpen(false)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/40 px-5 py-4 text-lg font-semibold text-zinc-100 hover:bg-zinc-900/60"
            >
              About Us
            </Link>

            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/40 px-5 py-4 text-lg font-semibold text-zinc-100 hover:bg-zinc-900/60"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/40 px-5 py-4 text-lg font-semibold text-zinc-100 hover:bg-zinc-900/60"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-2xl border border-zinc-800 bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-4 text-lg font-semibold text-white hover:from-indigo-400 hover:to-fuchsia-400"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>,
      document.body
    );
  }, [mounted, open, user]);

  return (
    <header className="relative z-10 border-b border-zinc-800/60 bg-zinc-950/50 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500">
            <span className="text-sm font-semibold text-white">G</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-100">{brandText}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-4 text-sm">
          <Link href="/about" className="text-zinc-400 hover:text-zinc-100">
            About Us
          </Link>
          {!isLoading && !user && (
            <Link href="/login" className="text-zinc-400 hover:text-zinc-100">
              Log in
            </Link>
          )}
          <Link href={primaryHref} className={primaryNavLinkClassName}>
            {primaryText}
          </Link>
        </nav>

        {/* Mobile / tablet dropdown */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link href={primaryHref} className={primaryNavLinkClassName}>
            {primaryText}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/40 text-zinc-200 hover:bg-zinc-900/60 transition-colors"
            aria-label="Open menu"
            aria-expanded={open}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {mobileMenu}
        </div>
      </div>
    </header>
  );
}

