'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import { BRAND, BrandMark } from '@/components/Layout/BrandMark';

type MobileMenuShellProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  id?: string;
  breakpoint?: 'md' | 'lg';
};

export function MobileMenuShell({
  open,
  onClose,
  children,
  id,
  breakpoint = 'md',
}: MobileMenuShellProps) {
  return (
    <div
      id={id}
      className={cn(
        'fixed inset-0 z-[300] flex h-[100dvh] w-screen flex-col',
        breakpoint === 'lg' ? 'lg:hidden' : 'md:hidden',
        'transition-[opacity,visibility] duration-200 ease-out',
        open ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
      )}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-zinc-950" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.35),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(217,70,239,0.15),transparent)]"
        aria-hidden
      />

      <div
        className={cn(
          'relative flex min-h-0 flex-1 flex-col transition-transform duration-200 ease-out',
          open ? 'translate-y-0' : 'translate-y-3'
        )}
      >
        <div className="relative shrink-0 border-b border-zinc-800/70 px-5 pb-6 pt-5">
          <div className="flex items-start justify-between gap-3">
            <Link
              href="/"
              onClick={onClose}
              className="flex min-w-0 flex-1 items-start gap-4 rounded-xl outline-none ring-offset-2 ring-offset-zinc-950 focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <BrandMark className="h-14 w-14 rounded-2xl shadow-lg shadow-indigo-500/30" />
              <div className="min-w-0 pt-0.5">
                <p className="text-2xl font-bold tracking-tight text-zinc-50">{BRAND.name}</p>
                <p className="mt-1 text-sm font-semibold text-transparent bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text">
                  {BRAND.tagline}
                </p>
                <p className="mt-2 max-w-[220px] text-xs leading-relaxed text-zinc-500">{BRAND.subtitle}</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-900/80 text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
              aria-label="Close menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">{children}</div>
      </div>
    </div>
  );
}

export function mobileNavLinkClass(active: boolean) {
  return cn(
    'flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-base font-semibold transition-colors',
    active
      ? 'border-violet-500/40 bg-violet-500/10 text-violet-100'
      : 'border-zinc-800/80 bg-zinc-900/40 text-zinc-100 hover:border-zinc-700 hover:bg-zinc-800/60'
  );
}
