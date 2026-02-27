'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/Layout/Header';
import { Card, CardContent } from '@/components/ui/Card';

export default function ProfileContactPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
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
