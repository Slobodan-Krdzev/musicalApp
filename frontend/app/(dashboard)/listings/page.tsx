'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function CreateListingPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState('');
  const [date, setDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [genre, setGenre] = useState('');

  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest<{ advert: { _id: string } }>('/api/adverts', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      router.push('/dashboard');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = {
      title,
      description: description || undefined,
      area: area || undefined,
      date: date || undefined,
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      genre: genre ? genre.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
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
          <h1 className="text-xl font-semibold text-zinc-100">Create listing</h1>
          <p className="text-sm text-zinc-400">Let venues know you&apos;re looking for gigs.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Band seeking weekend gigs" />
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
              <textarea
                className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-violet-500/50"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Input label="Area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Bratislava" />
            <Input label="Date (optional)" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input label="Duration (minutes)" type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
            <Input label="Genres (comma-separated)" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Rock, Indie" />
            <div className="flex gap-2">
              <Button type="submit" loading={create.isPending} disabled={!title.trim()}>
                Create listing
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
