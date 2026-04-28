'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Layout/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export default function ReviewApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [acting, setActing] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: () => apiRequest<{ application: any; entity: any; applicantProfile: any; ownerProfile: any; deal: any }>(`/api/applications/${id}`),
    enabled: !!id && !!user,
  });

  const app = data?.application;
  const entity = data?.entity;
  const applicantProfile = data?.applicantProfile;
  const isOwner = app?.ownerId === user?._id;
  const isApplicant = app?.applicantId === user?._id;
  const isEvent = app?.entityType === 'EVENT';

  async function handleAction(status: 'ACCEPTED' | 'REJECTED') {
    setActing(status);
    try {
      await apiRequest(`/api/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (status === 'ACCEPTED') {
        router.push(`/applications/${id}/finalize`);
      }
    } catch {
      setActing(null);
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950"><Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        {isLoading ? (
          <div className="space-y-4"><div className="h-8 bg-zinc-800 rounded w-1/2 animate-pulse" /><div className="h-64 bg-zinc-800 rounded animate-pulse" /></div>
        ) : !app ? (
          <p className="text-zinc-500 text-center py-20">Application not found.</p>
        ) : (
          <div className="space-y-6">
            <button type="button" onClick={() => router.back()} className="text-zinc-400 hover:text-zinc-200 text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-100">Application Review</h1>
              <Badge variant={app.status === 'PENDING' ? 'warning' : app.status === 'ACCEPTED' || app.status === 'FINALIZED' ? 'success' : 'danger'}>{app.status}</Badge>
            </div>

            {/* Entity details */}
            <Card>
              <CardHeader><h2 className="text-lg font-semibold text-zinc-100">{isEvent ? 'Event' : 'Offering'} Details</h2></CardHeader>
              <CardContent className="space-y-3">
                <h3 className="text-zinc-200 font-semibold">{entity?.title}</h3>
                {entity?.description && <p className="text-zinc-400 text-sm whitespace-pre-wrap">{entity.description}</p>}
                <div className="grid grid-cols-2 gap-3">
                  {entity?.date && <InfoBox label="Date" value={new Date(entity.date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })} />}
                  {entity?.activeTo && <InfoBox label="Active Until" value={new Date(entity.activeTo).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })} />}
                </div>
                {entity?.lookingFor?.length > 0 && (
                  <div><span className="text-xs text-zinc-500 block mb-1">Looking For</span><div className="flex flex-wrap gap-1.5">{entity.lookingFor.map((t: string) => <Badge key={t}>{t}</Badge>)}</div></div>
                )}
              </CardContent>
            </Card>

            {/* Applicant profile (visible to owner) */}
            {isOwner && applicantProfile && (
              <Card>
                <CardHeader><h2 className="text-lg font-semibold text-zinc-100">{isEvent ? 'Musician' : 'Venue'} Profile</h2></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">
                      {applicantProfile.avatarUrl ? (
                        <Image src={applicantProfile.avatarUrl} alt="" width={56} height={56} className="object-cover" unoptimized />
                      ) : (
                        <span className="flex items-center justify-center w-full h-full text-white text-lg font-bold">{((applicantProfile.bandName || applicantProfile.venueName || '?')[0]).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-zinc-100 font-semibold text-lg">{applicantProfile.bandName || applicantProfile.venueName || 'Unknown'}</p>
                      {applicantProfile.location && (
                        <p className="text-zinc-500 text-sm">{[applicantProfile.location.city, applicantProfile.location.country].filter(Boolean).join(', ')}</p>
                      )}
                    </div>
                  </div>
                  {(applicantProfile.bio || applicantProfile.description) && (
                    <p className="text-zinc-300 text-sm whitespace-pre-wrap">{applicantProfile.bio || applicantProfile.description}</p>
                  )}
                  {applicantProfile.genres?.length > 0 && (
                    <div><span className="text-xs text-zinc-500 block mb-1">Genres</span><div className="flex flex-wrap gap-1.5">{applicantProfile.genres.map((g: string) => <Badge key={g}>{g}</Badge>)}</div></div>
                  )}
                  {applicantProfile.images?.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {applicantProfile.images.slice(0, 6).map((url: string, i: number) => (
                        <div key={i} className="aspect-square rounded-lg overflow-hidden bg-zinc-800">
                          <Image src={url} alt="" width={200} height={200} className="object-cover w-full h-full" unoptimized />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quote & message */}
            <Card>
              <CardHeader><h2 className="text-lg font-semibold text-zinc-100">Application Details</h2></CardHeader>
              <CardContent className="space-y-3">
                {app.quote != null && (
                  <div className="flex items-center gap-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                    <span className="text-emerald-300 font-semibold text-lg">€{app.quote}</span>
                    <span className="text-zinc-500 text-sm">Quoted price</span>
                  </div>
                )}
                {app.message && <p className="text-zinc-300 text-sm whitespace-pre-wrap">{app.message}</p>}
                <p className="text-zinc-600 text-xs">Applied {new Date(app.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </CardContent>
            </Card>

            {/* Actions */}
            {isOwner && app.status === 'PENDING' && (
              <div className="flex gap-3">
                <Button variant="danger" className="flex-1" loading={acting === 'REJECTED'} disabled={!!acting} onClick={() => handleAction('REJECTED')}>
                  Decline
                </Button>
                <Button className="flex-1" loading={acting === 'ACCEPTED'} disabled={!!acting} onClick={() => handleAction('ACCEPTED')}>
                  Accept
                </Button>
              </div>
            )}

            {app.status === 'ACCEPTED' && (
              <Button className="w-full" onClick={() => router.push(`/applications/${id}/finalize`)}>View Deal & Finalize</Button>
            )}

            {app.status === 'FINALIZED' && (
              <div className="text-center py-4">
                <Badge variant="success" className="text-sm px-4 py-1.5">Deal Finalized</Badge>
              </div>
            )}

            {app.status === 'REJECTED' && (
              <div className="text-center py-4">
                <Badge variant="danger" className="text-sm px-4 py-1.5">Application Declined</Badge>
              </div>
            )}

            {app.status === 'AUTO_DECLINED' && (
              <div className="text-center py-4 space-y-2">
                <Badge variant="danger" className="text-sm px-4 py-1.5">Auto-Declined (No Response)</Badge>
                <p className="text-zinc-500 text-sm">This application expired because no response was given within 24 hours.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-800/50 p-3">
      <span className="text-xs text-zinc-500 block mb-0.5">{label}</span>
      <span className="text-sm text-zinc-200">{value}</span>
    </div>
  );
}
