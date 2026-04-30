'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/Layout/Header';
import { Card, CardContent } from '@/components/ui/Card';

export default function ProfileContactPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-6 sm:px-4 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-md">
          <Card>
            <CardContent className="p-6">
              <h1 className="text-xl font-semibold text-zinc-100 mb-2">Contact</h1>
              <p className="text-zinc-400 text-sm mb-4">
                Contact is available after signing in. You can message this user from their profile or via the application flow.
              </p>
              <Link href={`/profile/${id}`} className="text-violet-400 hover:underline text-sm">
                ← Back to profile
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
