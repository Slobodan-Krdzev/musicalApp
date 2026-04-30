'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

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
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/30 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/25">
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

              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-zinc-100">Platform under development</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                  GigConnection is in active development. You may see incomplete features, UI changes, or occasional bugs while we
                  polish the experience.
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  Thanks for checking it out — your feedback helps us move faster.
                </p>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <Link href="/about" className="sm:mr-auto">
                    <Button variant="ghost" className="w-full rounded-full border border-zinc-800 bg-zinc-900/40 sm:w-auto">
                      About Us
                    </Button>
                  </Link>
                  <Button
                    className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-zinc-50 hover:from-indigo-400 hover:to-fuchsia-400 sm:w-auto"
                    onClick={dismiss}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

