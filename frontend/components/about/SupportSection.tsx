'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CursorGlow } from '@/components/about/CursorGlow';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';
import { siteConfig } from '@/lib/site';
import { cn } from '@/lib/cn';

type SupportContact = {
  email: string;
  phone: string | null;
};

function reveal(delayMs: number, className?: string) {
  return cn(
    'animate-in fade-in slide-in-from-bottom-4 duration-700',
    className,
    `[animation-delay:${delayMs}ms]`
  );
}

export function SupportSection() {
  const { user } = useAuth();
  const { data: contact } = useQuery({
    queryKey: ['support-contact'],
    queryFn: () => apiRequest<{ contact: SupportContact }>('/api/support/contact').then((r) => r.contact),
  });

  const email = contact?.email || siteConfig.contactEmail;
  const phone = contact?.phone || null;
  const ticketHref = user ? '/support' : '/login?redirect=%2Fsupport';
  const ticketLabel = user ? 'Go to Support' : 'Log in for support';

  return (
    <section className={reveal(1200, 'mt-10')}>
      <div className="text-center sm:text-left">
        <p className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
          Support
        </p>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">We&apos;re here to help</h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-300 sm:text-base">
          Our support team works alongside the founders to help musicians and venues get the most out of GigConnection.
          Whether you have a question about your account, a booking, or how the platform works — reach out anytime.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <CursorGlow revealClassName={reveal(1280)} glow="sky" className="rounded-2xl border-zinc-800/80 bg-black/40 p-6">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Support email</p>
              <a
                href={`mailto:${email}`}
                className="mt-2 block break-all text-base font-semibold text-violet-300 transition-colors hover:text-violet-200"
              >
                {email}
              </a>
              <p className="mt-2 text-sm text-zinc-400">We typically reply within one business day.</p>
            </div>
          </div>
        </CursorGlow>

        <CursorGlow revealClassName={reveal(1360)} glow="indigo" className="rounded-2xl border-zinc-800/80 bg-black/40 p-6">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/25">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Support phone</p>
              {phone ? (
                <a
                  href={`tel:${phone.replace(/\s/g, '')}`}
                  className="mt-2 block text-base font-semibold text-violet-300 transition-colors hover:text-violet-200"
                >
                  {phone}
                </a>
              ) : (
                <p className="mt-2 text-base font-semibold text-zinc-300">Coming soon</p>
              )}
              <p className="mt-2 text-sm text-zinc-400">
                {phone ? 'Available during business hours.' : 'Email us in the meantime — we read every message.'}
              </p>
            </div>
          </div>
        </CursorGlow>
      </div>

      <CursorGlow
        revealClassName={reveal(1440)}
        glow="violet"
        className="mt-4 rounded-2xl border-zinc-800/80 bg-gradient-to-br from-violet-500/10 via-black/40 to-zinc-950 p-6 sm:p-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Need help with your account?</h3>
            <p className="mt-2 text-sm text-zinc-400">
              {user
                ? 'Open a support ticket and track replies from your account.'
                : 'Support tickets are available after you log in. Email us anytime in the meantime.'}
            </p>
          </div>
          <Link
            href={ticketHref}
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-violet-500/40 bg-violet-500/10 px-6 py-2.5 text-sm font-semibold text-violet-200 transition-colors hover:border-violet-400/50 hover:bg-violet-500/20"
          >
            {ticketLabel}
          </Link>
        </div>
      </CursorGlow>
    </section>
  );
}
