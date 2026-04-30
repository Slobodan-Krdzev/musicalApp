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

export default function FinalizeApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [finalizing, setFinalizing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['application', id],
    queryFn: () => apiRequest<{ application: any; entity: any; applicantProfile: any; ownerProfile: any; deal: any }>(`/api/applications/${id}`),
    enabled: !!id && !!user,
  });

  const app = data?.application;
  const entity = data?.entity;
  const applicantProfile = data?.applicantProfile;
  const ownerProfile = data?.ownerProfile;
  const deal = data?.deal;
  const isEvent = app?.entityType === 'EVENT';
  const isFinalized = app?.status === 'FINALIZED';

  const musicianProfile = isEvent ? applicantProfile : ownerProfile;
  const venueProfile = isEvent ? ownerProfile : applicantProfile;

  async function handleFinalize() {
    setFinalizing(true);
    try {
      await apiRequest(`/api/applications/${id}/finalize`, { method: 'PATCH' });
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await refetch();
    } finally {
      setFinalizing(false);
    }
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950"><Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-6 sm:px-4 sm:py-8">
        {isLoading ? (
          <div className="space-y-4"><div className="h-8 bg-zinc-800 rounded w-1/2 animate-pulse" /><div className="h-64 bg-zinc-800 rounded animate-pulse" /></div>
        ) : !app ? (
          <p className="text-zinc-500 text-center py-20">Application not found.</p>
        ) : app.status !== 'ACCEPTED' && app.status !== 'FINALIZED' ? (
          <div className="text-center py-20">
            <p className="text-zinc-400">This deal is not available for finalization.</p>
            <Button variant="secondary" className="mt-4" onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <button type="button" onClick={() => router.back()} className="text-zinc-400 hover:text-zinc-200 text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">{isFinalized ? 'Deal Complete' : 'Finalize Deal'}</h1>
              <Badge variant={isFinalized ? 'success' : 'warning'}>{isFinalized ? 'FINALIZED' : 'ACCEPTED'}</Badge>
            </div>

            {/* Event/Offering info */}
            <Card>
              <CardHeader><h2 className="text-lg font-semibold text-zinc-100">{isEvent ? 'Event' : 'Offering'}: {entity?.title}</h2></CardHeader>
              <CardContent className="space-y-3">
                {entity?.description && <p className="text-zinc-400 text-sm whitespace-pre-wrap">{entity.description}</p>}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {entity?.date && <InfoBox label="Date" value={new Date(entity.date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })} />}
                  {deal?.agreedQuote != null && <InfoBox label="Agreed Quote" value={`€${deal.agreedQuote}`} />}
                </div>
              </CardContent>
            </Card>

            {/* Venue Profile */}
            {venueProfile && <ProfileCard title="Venue" profile={venueProfile} showContactData={isFinalized} type="venue" />}

            {/* Musician Profile */}
            {musicianProfile && <ProfileCard title="Musician" profile={musicianProfile} showContactData={isFinalized} type="musician" />}

            {/* Finalize action */}
            {!isFinalized && (
              <Card className="border-emerald-500/30">
                <CardContent className="p-5 text-center space-y-4">
                  <h2 className="text-lg font-semibold text-zinc-100">Ready to finalize?</h2>
                  <p className="text-zinc-400 text-sm">
                    Once finalized, contact details will be shared between both parties and the {isEvent ? 'event' : 'offering'} will be marked as complete. 
                    The listing will be removed from public browsing but saved in both your dashboards.
                  </p>
                  <Button className="w-full" loading={finalizing} onClick={handleFinalize}>Finish Event</Button>
                </CardContent>
              </Card>
            )}

            {isFinalized && (
              <div className="text-center py-6 space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-emerald-400 font-semibold">Connection Successful!</p>
                <p className="text-zinc-500 text-sm">Use the contact details above to coordinate.</p>
                <Button variant="secondary" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ProfileCard({ title, profile, showContactData, type }: { title: string; profile: any; showContactData: boolean; type: 'venue' | 'musician' }) {
  const name = type === 'venue' ? profile.venueName : profile.bandName;
  const desc = type === 'venue' ? profile.description : profile.bio;

  return (
    <Card>
      <CardHeader><h2 className="text-lg font-semibold text-zinc-100">{title}</h2></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">
            {profile.avatarUrl ? (
              <Image src={profile.avatarUrl} alt="" width={56} height={56} className="object-cover" unoptimized />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-white text-lg font-bold">{(name || '?')[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="text-zinc-100 font-semibold text-lg">{name || 'Unknown'}</p>
            {profile.location && (
              <p className="text-zinc-500 text-sm">{[profile.location.city, profile.location.country].filter(Boolean).join(', ')}</p>
            )}
          </div>
        </div>

        {desc && <p className="text-zinc-300 text-sm whitespace-pre-wrap">{desc}</p>}

        {profile.genres?.length > 0 && (
          <div><span className="text-xs text-zinc-500 block mb-1">Genres</span><div className="flex flex-wrap gap-1.5">{profile.genres.map((g: string) => <Badge key={g}>{g}</Badge>)}</div></div>
        )}

        {showContactData && (
          <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4">
            <h3 className="text-sm font-semibold text-violet-400">Contact Details</h3>
            {profile.contactPhone && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <span className="text-zinc-300">{profile.contactPhone}</span>
              </div>
            )}
            {profile.location?.address && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-zinc-300">{profile.location.address}</span>
              </div>
            )}
            {profile.socialLinks && Object.entries(profile.socialLinks).filter(([, v]) => v).length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-zinc-500">Social Links</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(profile.socialLinks).filter(([, v]) => v).map(([k, v]) => (
                    <a key={k} href={v as string} target="_blank" rel="noopener noreferrer" className="text-violet-400 text-xs hover:underline">{k}</a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {profile.images?.length > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-2">
            {profile.images.slice(0, 6).map((url: string, i: number) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-zinc-800">
                <Image src={url} alt="" width={200} height={200} className="object-cover w-full h-full" unoptimized />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
