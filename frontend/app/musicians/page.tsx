'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Header } from '@/components/Layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

type Musician = {
  userId: string;
  bandName?: string;
  bio?: string;
  genres?: string[];
  location?: { city?: string; country?: string };
  email?: string;
};

type Res = {
  musicians: Musician[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

export default function MusiciansPage() {
  const [page, setPage] = useState(1);
  const [genre, setGenre] = useState('');

  const params: Record<string, string> = { page: String(page), limit: '12' };
  if (genre) params.genre = genre;

  const { data, isLoading } = useQuery({
    queryKey: ['musicians', page, genre],
    queryFn: () => apiRequest<Res>('/api/users/musicians', { params }),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-4">Browse Musicians</h1>
        <div className="mb-6 max-w-xs">
          <Input
            label="Filter by genre"
            placeholder="e.g. Rock"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          />
        </div>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-32 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.musicians?.map((m) => (
                <Link key={m.userId} href={`/profile/${m.userId}`}>
                  <Card className="hover:border-violet-500/50 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4">
                      <h2 className="font-semibold text-zinc-100 mb-1">{m.bandName || 'Musician'}</h2>
                      {m.genres?.length ? (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {m.genres.slice(0, 3).map((g) => (
                            <Badge key={g}>{g}</Badge>
                          ))}
                        </div>
                      ) : null}
                      <p className="text-zinc-500 text-sm line-clamp-2">{m.bio}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            {data?.pagination && data.pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <span className="flex items-center px-4 text-zinc-400 text-sm">
                  {page} / {data.pagination.pages}
                </span>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 disabled:opacity-50"
                  disabled={page >= data.pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
