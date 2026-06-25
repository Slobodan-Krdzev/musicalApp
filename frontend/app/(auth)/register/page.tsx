'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { useRegister } from '@/hooks/useAuth';
import { legalSectionHref } from '@/lib/legal';

type Role = 'MUSICIAN' | 'VENUE';

function parseRoleParam(value: string | null): Role | null {
  if (value === 'VENUE' || value === 'MUSICIAN') return value;
  return null;
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('MUSICIAN');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const register = useRegister();

  useEffect(() => {
    const fromQuery = parseRoleParam(searchParams.get('role'));
    if (fromQuery) setRole(fromQuery);
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate({ email, password, role });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <h1 className="text-xl font-semibold text-zinc-100">Create account</h1>
        <p className="text-sm text-zinc-400">Choose your role and sign up.</p>
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
            error={register.error?.message}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            required
            minLength={8}
          />
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">I am a</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="MUSICIAN"
                  checked={role === 'MUSICIAN'}
                  onChange={() => setRole('MUSICIAN')}
                  className="rounded border-zinc-600 text-violet-500 focus:ring-violet-500"
                />
                <span className="text-zinc-300">Musician / Band</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="VENUE"
                  checked={role === 'VENUE'}
                  onChange={() => setRole('VENUE')}
                  className="rounded border-zinc-600 text-violet-500 focus:ring-violet-500"
                />
                <span className="text-zinc-300">Venue</span>
              </label>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-3">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500"
              />
              <span className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
                I agree to the{' '}
                <Link href={legalSectionHref('terms')} target="_blank" className="text-violet-400 hover:underline">
                  Terms of Use
                </Link>{' '}
                and{' '}
                <Link href={legalSectionHref('privacy')} target="_blank" className="text-violet-400 hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>
          <Button type="submit" className="w-full" loading={register.isPending} disabled={!acceptedTerms}>
            Sign up
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-400 hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md">
          <CardContent className="flex justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </CardContent>
        </Card>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
