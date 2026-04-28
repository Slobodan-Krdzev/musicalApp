'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Layout/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';

export default function ApplyToEventPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [quote, setQuote] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => apiRequest<{ event: any; venueProfile: any }>(`/api/events/${id}`),
    enabled: !!id && !!user,
  });

  const event = data?.event;
  const vp = data?.venueProfile;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { eventId: id };
      if (quote) body.quote = Number(quote);
      if (message.trim()) body.message = message.trim();
      await apiRequest('/api/applications/event', { method: 'POST', body: JSON.stringify(body) });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user || user.role !== 'MUSICIAN') {
    return (
      <div className="min-h-screen flex flex-col"><Header />
        <main className="flex-1 flex items-center justify-center"><p className="text-zinc-500">Only musicians can apply to events.</p></main>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col"><Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-xl font-bold text-zinc-100">Application Sent!</h2>
              <p className="text-zinc-400 text-sm">We've notified the venue. You'll receive a notification when they respond.</p>
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="secondary" onClick={() => router.push('/events')}>Browse More</Button>
                <Button onClick={() => router.push('/dashboard')}>Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950"><Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        {isLoading ? (
          <div className="space-y-4"><div className="h-8 bg-zinc-800 rounded w-1/2 animate-pulse" /><div className="h-64 bg-zinc-800 rounded animate-pulse" /></div>
        ) : !event ? (
          <p className="text-zinc-500 text-center py-20">Event not found.</p>
        ) : (
          <div className="space-y-6">
            <button type="button" onClick={() => router.back()} className="text-zinc-400 hover:text-zinc-200 text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>

            <h1 className="text-2xl font-bold text-zinc-100">Apply to: {event.title}</h1>

            {/* Event Details */}
            <Card>
              <CardContent className="p-5 space-y-4">
                {vp && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">
                      {vp.avatarUrl ? <Image src={vp.avatarUrl} alt="" width={48} height={48} className="object-cover" unoptimized /> : <span className="flex items-center justify-center w-full h-full text-white font-bold">{(vp.venueName || '?')[0]}</span>}
                    </div>
                    <div>
                      <p className="text-zinc-100 font-semibold">{vp.venueName || 'Venue'}</p>
                      {vp.description && <p className="text-zinc-500 text-xs line-clamp-1">{vp.description}</p>}
                    </div>
                  </div>
                )}

                {event.description && <p className="text-zinc-300 text-sm whitespace-pre-wrap">{event.description}</p>}

                <div className="grid grid-cols-2 gap-3">
                  {event.date && (
                    <div className="rounded-lg bg-zinc-800/50 p-3">
                      <span className="text-xs text-zinc-500 block mb-0.5">Event Date</span>
                      <span className="text-sm text-zinc-200">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}
                  {event.activeTo && (
                    <div className="rounded-lg bg-zinc-800/50 p-3">
                      <span className="text-xs text-zinc-500 block mb-0.5">Active Until</span>
                      <span className="text-sm text-zinc-200">{new Date(event.activeTo).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>

                {event.lookingFor?.length > 0 && (
                  <div>
                    <span className="text-xs text-zinc-500 block mb-1">Looking For</span>
                    <div className="flex flex-wrap gap-1.5">{event.lookingFor.map((t: string) => <Badge key={t}>{t}</Badge>)}</div>
                  </div>
                )}

                {event.approximatePayment != null && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-zinc-500">Venue budget:</span>
                    <span className="text-emerald-400 font-semibold">~€{event.approximatePayment}</span>
                    {event.paymentType && <span className="text-zinc-500">({event.paymentType})</span>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quote form */}
            <Card>
              <CardContent className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-lg font-semibold text-zinc-100">Your Application</h2>
                  {error && <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

                  <div>
                    <label className="text-xs text-zinc-500 font-medium">Your Quote (€)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                      placeholder="Enter your price..."
                      value={quote}
                      onChange={(e) => setQuote(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-500 font-medium">Message (optional)</label>
                    <textarea
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                      rows={3}
                      placeholder="Tell the venue about yourself..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full" loading={submitting}>Send Application</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
