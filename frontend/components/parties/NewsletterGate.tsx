'use client';

import { useEffect, useState } from 'react';
import { grantNewsletterAccess, resendNewsletterVerification, type NewsletterPreferences } from '@/lib/newsletter';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';

type NewsletterGateProps = {
  onAccessGranted: () => void;
  initialEmail?: string;
};

export function NewsletterGate({ onAccessGranted, initialEmail = '' }: NewsletterGateProps) {
  const [email, setEmail] = useState(initialEmail);
  const [locationLabel, setLocationLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  function buildPreferences(): NewsletterPreferences {
    return {
      locationLabel: locationLabel.trim(),
      radiusKm: 40,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!locationLabel.trim()) {
      setError('Enter your city or area.');
      return;
    }

    setLoading(true);
    try {
      const result = await grantNewsletterAccess(email.trim(), buildPreferences());
      if (result.needsVerification) {
        setPendingVerification(true);
        setPendingEmail(email.trim());
        setSuccess(result.message);
        return;
      }
      setSuccess(result.message);
      onAccessGranted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not continue');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!pendingEmail) return;
    setError(null);
    setLoading(true);
    try {
      const result = await resendNewsletterVerification(pendingEmail);
      setSuccess(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend email');
    } finally {
      setLoading(false);
    }
  }

  if (pendingVerification) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-2 py-12 text-center sm:py-16">
        <div className="relative w-full overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-zinc-900/90 to-zinc-950 p-6 sm:p-8">
          <div className="relative text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/15 ring-1 ring-violet-500/30">
              <svg className="h-7 w-7 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Check your email</h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
              We sent a verification link to{' '}
              <strong className="text-zinc-200">{pendingEmail}</strong>. Click it to unlock the parties page and your
              weekly digest.
            </p>
            {success && <p className="mt-4 text-sm text-emerald-400">{success}</p>}
            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button variant="secondary" loading={loading} onClick={handleResend}>
                Resend verification email
              </Button>
            </div>
            <p className="mt-6 text-xs text-zinc-500">The link expires in 24 hours. Check spam if you don&apos;t see it.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-2 py-12 text-center sm:py-16">
      <div className="relative w-full overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-zinc-900/90 to-zinc-950 p-6 sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124, 58, 237, 0.2) 0%, transparent 70%)',
          }}
        />
        <div className="relative text-left">
          <p className="inline-flex items-center rounded-full border border-zinc-700/80 bg-zinc-900/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-300">
            Party newsletter
          </p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">Wanna see the parties?</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
            Subscribe to browse public parties and get a <strong className="text-zinc-300">weekly email</strong> with gigs
            matched to your location. We&apos;ll email you a verification link before you can browse.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="parties-newsletter-email" className="mb-1.5 block text-sm font-medium text-zinc-300">
                Email
              </label>
              <input
                id="parties-newsletter-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={cn(
                  'w-full rounded-xl border border-zinc-700 bg-zinc-900/90 px-4 py-3 text-zinc-100 placeholder-zinc-500',
                  'focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30'
                )}
              />
            </div>

            <div>
              <label htmlFor="parties-newsletter-location" className="mb-1.5 block text-sm font-medium text-zinc-300">
                Your location <span className="text-red-400">*</span>
              </label>
              <input
                id="parties-newsletter-location"
                type="text"
                required
                value={locationLabel}
                onChange={(e) => setLocationLabel(e.target.value)}
                placeholder="e.g. Skopje, North Macedonia"
                className={cn(
                  'w-full rounded-xl border border-zinc-700 bg-zinc-900/90 px-4 py-3 text-zinc-100 placeholder-zinc-500',
                  'focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30'
                )}
              />
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Send verification email
            </Button>
          </form>

          {success && <p className="mt-4 text-sm text-emerald-400">{success}</p>}
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <p className="mt-6 text-xs leading-relaxed text-zinc-500">
            One personalized digest per week. Unsubscribe anytime from any email.
          </p>
        </div>
      </div>
    </div>
  );
}
