'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

export function NewsletterSection() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Enter your email address.');
      return;
    }
    router.push(`/parties?email=${encodeURIComponent(trimmed)}`);
  }

  return (
    <section className="relative overflow-hidden border-y border-zinc-800/60 bg-zinc-950 px-4 py-16 sm:py-20">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(124, 58, 237, 0.25) 0%, rgba(9, 9, 11, 0.95) 70%, rgb(3, 7, 18) 100%)',
        }}
      />
      <div className="relative mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">Wanna Party!</h2>
        <p className="mt-3 text-base text-zinc-400 sm:text-lg">
          Join our newsletter for a weekly digest of parties near you. Enter your email to finish signup on the parties
          page — you&apos;ll verify your email before browsing.
        </p>

        <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-md">
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className={cn(
                'w-full rounded-full border border-zinc-700 bg-zinc-900/80 py-3.5 pl-5 pr-14 text-zinc-100 placeholder-zinc-500',
                'focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30'
              )}
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-violet-500 text-white transition-colors hover:bg-violet-400"
              aria-label="Continue to parties"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </form>
      </div>
    </section>
  );
}
