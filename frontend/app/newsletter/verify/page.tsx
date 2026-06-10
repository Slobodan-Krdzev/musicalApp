'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PublicNavbar } from '@/components/PublicNavbar';
import { Button } from '@/components/ui/Button';
import { confirmNewsletterEmail } from '@/lib/newsletter';

function VerifyInner() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!email || !token) {
      setStatus('error');
      setMessage('This verification link is invalid or incomplete.');
      return;
    }

    let active = true;
    setStatus('loading');

    confirmNewsletterEmail(email, token)
      .then((data) => {
        if (!active) return;
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
      })
      .catch((err: Error) => {
        if (!active) return;
        setStatus('error');
        setMessage(err.message || 'Verification failed.');
      });

    return () => {
      active = false;
    };
  }, [email, token]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <PublicNavbar />

      <main className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 py-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 50% 20%, rgba(88, 28, 135, 0.35) 0%, rgba(30, 27, 75, 0.12) 45%, rgba(9, 9, 11, 0.98) 78%, rgb(3, 7, 18) 100%)',
          }}
        />

        <div className="relative w-full max-w-md rounded-2xl border border-zinc-800/80 bg-black/40 p-8 text-center backdrop-blur-sm">
          {status === 'loading' && (
            <>
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              <h1 className="text-xl font-semibold text-zinc-100">Verifying your email…</h1>
              <p className="mt-2 text-sm text-zinc-400">Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
                <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-zinc-100">Email verified!</h1>
              <p className="mt-2 text-sm text-zinc-400">{message}</p>
              <p className="mt-1 text-xs text-zinc-500">You can now browse parties and receive your weekly digest.</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-500/30">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-zinc-100">Verification failed</h1>
              <p className="mt-2 text-sm text-zinc-400">{message}</p>
            </>
          )}

          {status !== 'loading' && (
            <div className="mt-8 flex flex-col gap-2">
              {status === 'success' ? (
                <Link href="/parties">
                  <Button className="w-full">Browse parties</Button>
                </Link>
              ) : (
                <Link href="/parties">
                  <Button className="w-full">Back to parties signup</Button>
                </Link>
              )}
              <Link
                href="/"
                className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/60 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
              >
                Homepage
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function NewsletterVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      }
    >
      <VerifyInner />
    </Suspense>
  );
}
