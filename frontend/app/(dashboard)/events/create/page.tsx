'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function CreateEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [genre, setGenre] = useState('');
  const [budget, setBudget] = useState('');
  const [expectations, setExpectations] = useState('');

  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest<{ event: { _id: string } }>('/api/events', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      router.push(`/events/${data.event._id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = {
      title,
      description: description || undefined,
      date: date || undefined,
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      genre: genre ? genre.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      budget: budget ? Number(budget) : undefined,
      expectations: expectations || undefined,
    };
    create.mutate(body);
  };

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/dashboard" className="text-violet-400 hover:underline text-sm mb-4 inline-block">
        ← Dashboard
      </Link>
      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold text-zinc-100">Create event</h1>
          <p className="text-sm text-zinc-400">Fill in the details. Musicians matching genre/location will be notified.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Friday Live Night" />
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
              <textarea
                className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-violet-500/50"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What you're looking for..."
              />
            </div>
            <Input label="Date" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input label="Duration (minutes)" type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="180" />
            <Input label="Genres (comma-separated)" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Rock, Indie" />
            <Input label="Budget (optional)" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Expectations</label>
              <textarea
                className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-violet-500/50"
                rows={2}
                value={expectations}
                onChange={(e) => setExpectations(e.target.value)}
                placeholder="e.g. Own equipment, 90 min set"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={create.isPending} disabled={!title.trim()}>
                Create event
              </Button>
              <Link href="/dashboard">
                <Button type="button" variant="ghost">Cancel</Button>
              </Link>
            </div>
            {create.error && <p className="text-sm text-red-400">{create.error.message}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
