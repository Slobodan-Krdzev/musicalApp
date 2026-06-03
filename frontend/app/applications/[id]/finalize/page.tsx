'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { getFinalizationStatus } from '@/lib/application';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Layout/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { SocialLinksChips } from '@/components/SocialLinksChips';
import { DealChatModal } from '@/components/deals/DealChatModal';

export default function FinalizeApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [finalizing, setFinalizing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

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
  const finalization = app ? getFinalizationStatus(app, user?._id) : null;
  const currentUserFinalized = !!finalization?.currentUserFinalized;
  const waitingOnPartner = !isFinalized && currentUserFinalized;

  const musicianProfile = isEvent ? applicantProfile : ownerProfile;
  const venueProfile = isEvent ? ownerProfile : applicantProfile;

  const isApplicant = user && app && app.applicantId === user._id;
  const partnerProfile = isApplicant ? ownerProfile : applicantProfile;
  const partnerName = partnerProfile
    ? (isEvent
        ? (isApplicant ? partnerProfile.venueName : partnerProfile.bandName)
        : (isApplicant ? partnerProfile.bandName : partnerProfile.venueName))
    : 'Partner';

  useEffect(() => {
    if (isFinalized && searchParams.get('chat') === '1') {
      setChatOpen(true);
    }
  }, [isFinalized, searchParams]);

  async function handleFinalize() {
    setFinalizing(true);
    try {
      await apiRequest(`/api/applications/${id}/finalize`, { method: 'PATCH' });
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await refetch();
    } finally {
      setFinalizing(false);
    }
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950"><Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-6 sm:px-4 sm:py-8">
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
            <div className="sticky top-16 z-30 -mx-3 border-b border-zinc-800/60 bg-zinc-950/95 px-3 py-4 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/85 sm:-mx-4 sm:px-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => router.back()} className="text-zinc-400 hover:text-zinc-200 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    Back
                  </button>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">{isFinalized ? 'Deal Finalized' : 'Finalize Deal'}</h1>
                    <Badge variant={isFinalized ? 'success' : 'warning'}>{isFinalized ? 'FINALIZED' : 'ACCEPTED'}</Badge>
                    {isFinalized && user && (
                      <Button variant="secondary" size="sm" onClick={() => setChatOpen(true)} className="gap-2 sm:ml-auto">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Chat
                      </Button>
                    )}
                  </div>

                  <Card className="mt-4 max-w-sm border-zinc-800">
                    <CardHeader className="pb-2 pt-3">
                      <h2 className="text-sm font-semibold text-zinc-100">{isEvent ? 'Event' : 'Offering'}: {entity?.title}</h2>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0 pb-3">
                      {entity?.description && (
                        <p className="text-zinc-500 text-xs whitespace-pre-wrap line-clamp-2">{entity.description}</p>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        {entity?.date && (
                          <InfoBox
                            label="Date"
                            value={new Date(entity.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          />
                        )}
                        {deal?.agreedQuote != null && <InfoBox label="Agreed Quote" value={`€${deal.agreedQuote}`} />}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {!isFinalized && finalization && (
                  <Card className="w-full shrink-0 border-emerald-500/30 lg:max-w-md">
                    <CardContent className="space-y-4 p-4">
                      <h2 className="text-base font-semibold text-zinc-100 text-center">Ready to finalize?</h2>
                      <p className="text-zinc-400 text-sm text-center">
                        Both parties must click finalize before the deal is complete. Once both have confirmed,
                        contact details will be shared and the {isEvent ? 'event' : 'offering'} will be marked as agreed.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 text-xs">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${finalization.musicianFinalized ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                          {finalization.musicianFinalized ? '✓' : '○'} Musician finalized
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${finalization.venueFinalized ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                          {finalization.venueFinalized ? '✓' : '○'} Venue finalized
                        </span>
                      </div>
                      {waitingOnPartner ? (
                        <div className="text-center space-y-1 py-1">
                          <p className="text-amber-400 text-sm font-medium">You have finalized your side.</p>
                          <p className="text-zinc-500 text-xs">Waiting for {partnerName} to finalize before contact details are shared.</p>
                        </div>
                      ) : (
                        <Button className="w-full" loading={finalizing} onClick={handleFinalize}>
                          Finalize on my side
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Venue & musician — side by side from lg */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
              {venueProfile && (
                <ProfileCard title="Venue" profile={venueProfile} showContactData={isFinalized} type="venue" />
              )}
              {musicianProfile && (
                <ProfileCard title="Musician" profile={musicianProfile} showContactData={isFinalized} type="musician" />
              )}
            </div>

            {isFinalized && (
              <div className="text-center py-6 space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-emerald-400 font-semibold">Connection Successful!</p>
                <p className="text-zinc-500 text-sm">Use the contact details above or open chat to coordinate.</p>
                <Button variant="secondary" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
              </div>
            )}
          </div>
        )}
      </main>

      {isFinalized && user && id && (
        <DealChatModal
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          applicationId={id}
          currentUserId={user._id}
          partnerName={partnerName || 'Partner'}
        />
      )}
    </div>
  );
}

function ProfileCard({ title, profile, showContactData, type }: { title: string; profile: any; showContactData: boolean; type: 'venue' | 'musician' }) {
  const name = type === 'venue' ? profile.venueName : profile.bandName;
  const desc = type === 'venue' ? profile.description : profile.bio;

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader>
        <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-3">
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
            {showContactData && profile.socialLinks && (
              <SocialLinksChips links={profile.socialLinks} className="pt-1" />
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
