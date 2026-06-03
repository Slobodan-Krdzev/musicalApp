'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { useLogin } from '@/hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <h1 className="text-xl font-semibold text-zinc-100">Log in</h1>
        <p className="text-sm text-zinc-400">Enter your email and password.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            error={login.error?.message}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-violet-400 hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full" loading={login.isPending}>
            Log in
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-violet-400 hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
