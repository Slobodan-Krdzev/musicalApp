'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Header } from '@/components/Layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type Musician = {
  userId: string;
  bandName?: string;
  bio?: string;
  genres?: string[];
  interests?: string[];
  avatarUrl?: string;
  location?: { city?: string; country?: string };
  email?: string;
};

type Venue = {
  userId: string;
  venueName?: string;
  description?: string;
  interests?: string[];
  avatarUrl?: string;
  gigTypes?: string[];
  location?: { city?: string; country?: string };
  email?: string;
};

type MusiciansRes = {
  musicians: Musician[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

type VenuesRes = {
  venues: Venue[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

type FilterType = 'ALL' | 'MUSICIAN' | 'VENUE';

export default function DirectoryPage() {
  const [page, setPage] = useState(1);
  const [genre, setGenre] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('ALL');

  const params: Record<string, string> = { page: String(page), limit: '12' };
  if (genre) params.genre = genre;

  const {
    data: musiciansData,
    isLoading: musiciansLoading,
  } = useQuery({
    queryKey: ['musicians', page, genre],
    queryFn: () => apiRequest<MusiciansRes>('/api/users/musicians', { params }),
  });

  const {
    data: venuesData,
    isLoading: venuesLoading,
  } = useQuery({
    queryKey: ['venues', page],
    queryFn: () => apiRequest<VenuesRes>('/api/users/venues', { params: { page: String(page), limit: '12' } }),
  });

  const isLoading = musiciansLoading || venuesLoading;

  const items = useMemo(() => {
    const musicians = (musiciansData?.musicians || []).map((m) => ({
      id: m.userId,
      type: 'MUSICIAN' as const,
      name: m.bandName || 'Musician',
      avatarUrl: m.avatarUrl,
      interests: m.interests && m.interests.length ? m.interests : m.genres || [],
      subtitle: m.bio,
    }));
    const venues = (venuesData?.venues || []).map((v) => ({
      id: v.userId,
      type: 'VENUE' as const,
      name: v.venueName || 'Venue',
      avatarUrl: v.avatarUrl,
      interests: v.interests && v.interests.length ? v.interests : v.gigTypes || [],
      subtitle: v.description,
    }));
    let all = [...musicians, ...venues];
    if (filterType === 'MUSICIAN') all = musicians;
    if (filterType === 'VENUE') all = venues;
    return all;
  }, [musiciansData, venuesData, filterType]);

  const totalPages =
    filterType === 'VENUE'
      ? venuesData?.pagination?.pages || 1
      : musiciansData?.pagination?.pages || 1;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 mb-1">Browse Musicians & Venues</h1>
            <p className="text-zinc-400 text-sm">
              Discover artists and venues and open their profile pages.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={filterType === 'ALL' ? 'default' : 'ghost'}
                onClick={() => setFilterType('ALL')}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={filterType === 'MUSICIAN' ? 'default' : 'ghost'}
                onClick={() => setFilterType('MUSICIAN')}
              >
                Musicians
              </Button>
              <Button
                size="sm"
                variant={filterType === 'VENUE' ? 'default' : 'ghost'}
                onClick={() => setFilterType('VENUE')}
              >
                Venues
              </Button>
            </div>
            <div className="min-w-[200px]">
              <Input
                label="Filter by genre (musicians)"
                placeholder="e.g. Rock"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-32 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Link key={`${item.type}-${item.id}`} href={`/profile/${item.id}`}>
                  <Card className="hover:border-violet-500/50 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4 flex gap-3">
                      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.avatarUrl ? (
                          <Image
                            src={item.avatarUrl}
                            alt={item.name}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                            unoptimized
                          />
                        ) : (
                          <span className="text-xs text-zinc-500">
                            {item.type === 'MUSICIAN' ? 'Artist' : 'Venue'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h2 className="font-semibold text-zinc-100 truncate">{item.name}</h2>
                          <Badge variant="outline">{item.type === 'MUSICIAN' ? 'Musician' : 'Venue'}</Badge>
                        </div>
                        {item.interests && item.interests.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {item.interests.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {item.subtitle && (
                          <p className="text-zinc-500 text-xs line-clamp-2">{item.subtitle}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {!items.length && (
                <p className="text-zinc-500 text-sm col-span-full">
                  No profiles found. Try adjusting your filters.
                </p>
              )}
            </div>
            {totalPages > 1 && (
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
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 disabled:opacity-50"
                  disabled={page >= totalPages}
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
