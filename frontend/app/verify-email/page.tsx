'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

function VerifyEmailLinks({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-2 text-sm ${className}`}>
      <Link href="/" className="text-violet-400 hover:underline">
        Back to homepage
      </Link>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-zinc-500">
        <Link href="/login" className="hover:text-zinc-300">
          Log in
        </Link>
        <span aria-hidden>·</span>
        <Link href="/register" className="hover:text-zinc-300">
          Sign up
        </Link>
      </div>
    </div>
  );
}

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    setStatus('verifying');
    apiRequest<{ message: string }>(`/api/auth/verify-email?token=${token}`)
      .then((data) => {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        queryClient.invalidateQueries({ queryKey: ['auth'] });
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Verification failed');
      });
  }, [token, queryClient]);

  const resendMutation = useMutation({
    mutationFn: () =>
      apiRequest('/api/auth/resend-verification', { method: 'POST' }),
    onSuccess: () => setMessage('Verification email sent! Check your inbox.'),
  });

  if (token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-3 py-8 sm:px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center sm:p-8">
            {status === 'verifying' && (
              <>
                <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-bold text-zinc-100 mb-2">Verifying your email...</h2>
              </>
            )}
            {status === 'success' && (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-zinc-100 mb-2">Email Verified!</h2>
                <p className="text-zinc-400 text-sm mb-6">{message}</p>
                <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
                <VerifyEmailLinks className="mt-5" />
              </>
            )}
            {status === 'error' && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-zinc-100 mb-2">Verification Failed</h2>
                <p className="text-zinc-400 text-sm mb-6">{message}</p>
                <div className="flex flex-col gap-2">
                  <Button variant="secondary" onClick={() => router.push('/verify-email')}>
                    Try again
                  </Button>
                </div>
                <VerifyEmailLinks className="mt-5" />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-3 py-8 sm:px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center sm:p-8">
          <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-100 mb-2">Check your email</h2>
          <p className="text-zinc-400 text-sm mb-2">
            We&apos;ve sent a verification link to{' '}
            <strong className="text-zinc-200">{user?.email || 'your email address'}</strong>.
          </p>
          <p className="text-zinc-500 text-xs mb-6">
            Click the link in the email to verify your account. Dashboard access is available after verification.
          </p>
          {message && <p className="text-emerald-400 text-sm mb-4">{message}</p>}
          <div className="flex flex-col gap-2">
            <Button
              variant="secondary"
              loading={resendMutation.isPending}
              onClick={() => resendMutation.mutate()}
              disabled={!user}
            >
              Resend verification email
            </Button>
            {user && (
              <Button variant="ghost" onClick={logout}>
                Log out
              </Button>
            )}
          </div>
          {resendMutation.error && (
            <p className="text-red-400 text-sm mt-2">{(resendMutation.error as Error).message}</p>
          )}
          <VerifyEmailLinks className="mt-6" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-3 sm:px-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
