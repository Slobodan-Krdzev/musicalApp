'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
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
                <Button variant="secondary" onClick={() => router.push('/verify-email')}>Back</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-100 mb-2">Check your email</h2>
          <p className="text-zinc-400 text-sm mb-2">
            We&apos;ve sent a verification link to <strong className="text-zinc-200">{user?.email}</strong>.
          </p>
          <p className="text-zinc-500 text-xs mb-6">
            Click the link in the email to verify your account and start using GigConnection.
          </p>
          {message && <p className="text-emerald-400 text-sm mb-4">{message}</p>}
          <Button
            variant="secondary"
            loading={resendMutation.isPending}
            onClick={() => resendMutation.mutate()}
          >
            Resend verification email
          </Button>
          {resendMutation.error && (
            <p className="text-red-400 text-sm mt-2">{(resendMutation.error as Error).message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
          <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
