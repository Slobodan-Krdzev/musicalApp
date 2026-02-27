'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Header } from '@/components/Layout/Header';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';

type EventData = {
  event: {
    _id: string;
    title: string;
    description?: string;
    date?: string;
    durationMinutes?: number;
    genre?: string[];
    budget?: number;
    expectations?: string;
    status: string;
    venueId?: { _id: string; email: string };
  };
  venueProfile?: { venueName?: string; description?: string; capacity?: number } | null;
};

export default function EventDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => apiRequest<EventData>(`/api/events/${id}`),
    enabled: !!id,
  });

  const applyMutation = useMutation({
    mutationFn: (message: string) =>
      apiRequest('/api/applications', {
        method: 'POST',
        body: JSON.stringify({ eventId: id, message }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      setShow(false);
      setMsg('');
    },
  });

  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);

  if (!id) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <p className="text-zinc-400">Invalid event.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="animate-pulse h-64 rounded-xl bg-zinc-800" />
        ) : data?.event ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <Link href="/events" className="text-violet-400 hover:underline text-sm">
              ← Back to events
            </Link>
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-100">{data.event.title}</h1>
                  <Badge>{data.event.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.event.date && (
                  <p className="text-zinc-400">
                    Date: {new Date(data.event.date).toLocaleString()}
                  </p>
                )}
                {data.event.genre && data.event.genre.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {data.event.genre.map((g) => (
                      <Badge key={g}>{g}</Badge>
                    ))}
                  </div>
                )}
                {data.event.description && (
                  <p className="text-zinc-300">{data.event.description}</p>
                )}
                {data.event.budget != null && (
                  <p className="text-zinc-400">Budget: €{data.event.budget}</p>
                )}
                {data.event.expectations && (
                  <p className="text-zinc-400 text-sm">{data.event.expectations}</p>
                )}
                {data.venueProfile && (
                  <div className="pt-4 border-t border-zinc-800">
                    <h3 className="font-semibold text-zinc-100">{data.venueProfile.venueName || 'Venue'}</h3>
                    <p className="text-zinc-400 text-sm">{data.venueProfile.description}</p>
                    {data.venueProfile.capacity && (
                      <p className="text-zinc-500 text-sm">Capacity: {data.venueProfile.capacity}</p>
                    )}
                  </div>
                )}
                {user?.role === 'MUSICIAN' && data.event.status === 'OPEN' && (
                  <div className="pt-4">
                    {!show ? (
                      <Button onClick={() => setShow(true)}>Apply to this event</Button>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-violet-500/50"
                          rows={3}
                          placeholder="Message (optional)"
                          value={msg}
                          onChange={(e) => setMsg(e.target.value)}
                        />
                        <div className="flex flex-col gap-2">
                          {applyMutation.error && (
                            <p className="text-sm text-violet-400">{applyMutation.error.message}</p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              loading={applyMutation.isPending}
                              onClick={() => applyMutation.mutate(msg)}
                            >
                              Send application
                            </Button>
                            <Button variant="ghost" onClick={() => setShow(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-zinc-400">Event not found.</p>
        )}
      </main>
    </div>
  );
}
