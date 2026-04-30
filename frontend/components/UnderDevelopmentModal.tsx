'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';

const STORAGE_KEY = 'gigconnection_dev_notice_v1';

type UnderDevelopmentModalProps = {
  /**
   * If true, modal will show even if already dismissed (useful for testing).
   */
  forceOpen?: boolean;
};

export function UnderDevelopmentModal({ forceOpen }: UnderDevelopmentModalProps) {
  const [open, setOpen] = useState(false);

  const shouldForceOpen = useMemo(() => Boolean(forceOpen), [forceOpen]);

  useEffect(() => {
    if (shouldForceOpen) {
      setOpen(true);
      return;
    }

    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setOpen(true);
    } catch {
      // If storage is blocked, still show once per page load.
      setOpen(true);
    }
  }, [shouldForceOpen]);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  }

  return (
    <Modal open={open} onClose={dismiss} position="center" className="max-w-lg">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/10 to-transparent" />
        <div className="relative p-1">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/30 p-5 sm:p-7">
            <div className="flex flex-row flex-wrap items-center justify-center gap-3">
              <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/25">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 8v4m0 4h.01M10.29 3.86l-7.1 12.3A2 2 0 004.92 19h14.16a2 2 0 001.73-2.84l-7.1-12.3a2 2 0 00-3.42 0z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="text-center text-lg font-semibold leading-snug text-zinc-100 sm:text-xl">
                Platform under development
              </h2>
            </div>

            <div className="mx-auto mt-5 max-w-md text-center">
              <p className="text-sm leading-relaxed text-zinc-300 sm:text-[15px]">
                GigConnection is in active development. You may see incomplete features, UI changes, or occasional bugs while we
                polish the experience.
              </p>
              <p className="mt-3 text-sm text-zinc-400 sm:text-[15px]">
                Thanks for checking it out — your feedback helps us move faster.
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Link
                href="/about"
                onClick={dismiss}
                className={cn(
                  'inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/50 px-8 text-base font-semibold text-zinc-100 transition-colors',
                  'hover:border-zinc-600 hover:bg-zinc-800/60 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950 sm:w-auto sm:min-w-[160px]'
                )}
              >
                About Us
              </Link>
              <button
                type="button"
                onClick={dismiss}
                className={cn(
                  'inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-8 text-base font-semibold text-zinc-50 transition-colors',
                  'hover:from-indigo-400 hover:to-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-zinc-950 sm:w-auto sm:min-w-[160px]'
                )}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

