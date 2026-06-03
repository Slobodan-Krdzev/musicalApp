'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest<{ message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
        token: null,
      }),
    onSuccess: () => setSubmitted(true),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <h1 className="text-xl font-semibold text-zinc-100">Forgot password</h1>
        <p className="text-sm text-zinc-400">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-zinc-300">
              If an account exists for <strong className="text-zinc-100">{email}</strong>, check your inbox for a reset link.
            </p>
            <Link href="/login" className="text-sm text-violet-400 hover:underline">
              Back to log in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              error={mutation.error?.message}
            />
            <Button type="submit" className="w-full" loading={mutation.isPending}>
              Send reset link
            </Button>
          </form>
        )}
        {!submitted && (
          <p className="mt-4 text-center text-sm text-zinc-400">
            Remember your password?{' '}
            <Link href="/login" className="text-violet-400 hover:underline">
              Log in
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
