'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Header } from '@/components/Layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FilterPanel } from '@/components/FilterPanel';
import { Badge } from '@/components/ui/Badge';

type EventItem = {
  _id: string;
  title: string;
  description?: string;
  date?: string;
  genre?: string[];
  status: string;
  venueId?: { email: string };
};

type Res = {
  events: EventItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

export default function EventsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{ genre?: string; location?: string; dateFrom?: string; dateTo?: string }>({});

  const params: Record<string, string> = { page: String(page), limit: '12' };
  if (filters.genre) params.genre = filters.genre;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;

  const { data, isLoading } = useQuery({
    queryKey: ['events', page, filters],
    queryFn: () =>
      apiRequest<Res>('/api/events', {
        params,
      }),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-zinc-100">Events</h1>
        </div>

        <FilterPanel
          filters={filters}
          onFilterChange={(key, value) => setFilters((f) => ({ ...f, [key]: value || undefined }))}
          onReset={() => setFilters({})}
          className="mb-8"
        />

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-40 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.events?.map((event) => (
                <Link key={event._id} href={`/events/${event._id}`}>
                  <Card className="hover:border-violet-500/50 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4">
                      <h2 className="font-semibold text-zinc-100 mb-1">{event.title}</h2>
                      {event.genre?.length ? (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {event.genre.map((g) => (
                            <Badge key={g} variant="default">{g}</Badge>
                          ))}
                        </div>
                      ) : null}
                      {event.date && (
                        <p className="text-zinc-400 text-sm mb-2">
                          {new Date(event.date).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-zinc-500 text-sm line-clamp-2">{event.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            {data?.pagination && data.pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-zinc-400 text-sm">
                  {page} / {data.pagination.pages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= data.pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
