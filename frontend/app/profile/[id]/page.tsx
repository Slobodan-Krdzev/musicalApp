'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Header } from '@/components/Layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

type MusicianProfile = {
  bandName?: string;
  bio?: string;
  avatarUrl?: string;
  images?: string[];
  genres?: string[];
  interests?: string[];
  location?: { city?: string; country?: string };
  contactEmail?: string;
  contactPhone?: string;
};

type VenueProfile = {
  venueName?: string;
  description?: string;
  avatarUrl?: string;
  images?: string[];
  gigTypes?: string[];
  interests?: string[];
  capacity?: number;
  location?: { address?: string; city?: string; country?: string };
  contactEmail?: string;
  website?: string;
};

type ProfileRes = {
  user: { _id: string; email: string; role: string };
  profile: (MusicianProfile & VenueProfile) | null;
};

type EventsRes = {
  events: Array<{ _id: string; title: string; date?: string; status: string }>;
};

export default function ProfilePage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  if (!id) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <p className="text-zinc-400">Invalid profile.</p>
        </main>
      </div>
    );
  }

  const { data, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => apiRequest<ProfileRes>(`/api/users/profile/${id}`),
    enabled: !!id,
  });

  const isMusician = data?.user?.role === 'MUSICIAN';
  const isVenue = data?.user?.role === 'VENUE';
  const profile = data?.profile;

  const { data: venueEvents } = useQuery({
    queryKey: ['profile-events', id],
    queryFn: () =>
      apiRequest<EventsRes>('/api/events', {
        params: { venueId: id!, limit: '6' },
      }),
    enabled: !!id && !!isVenue,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="animate-pulse h-64 rounded-xl bg-zinc-800 max-w-2xl" />
        </main>
      </div>
    );
  }

  if (!data?.user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <p className="text-zinc-400">Profile not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-6 sm:px-4 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <section className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="mx-auto h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-600/60 to-fuchsia-500/40 shadow-lg shadow-violet-500/20 flex items-center justify-center sm:mx-0">
              {profile?.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={isMusician ? profile.bandName || 'Artist avatar' : profile.venueName || 'Venue avatar'}
                  width={112}
                  height={112}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <span className="text-sm text-zinc-200">
                  {isMusician ? 'Artist' : 'Venue'}
                </span>
              )}
            </div>
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-50">
                  {isMusician ? profile?.bandName || 'Musician' : profile?.venueName || 'Venue'}
                </h1>
                <Badge variant="default" className="uppercase tracking-wide text-xs">
                  {data.user.role}
                </Badge>
              </div>
              <p className="text-zinc-400 text-sm">
                {isMusician
                  ? profile?.bio || 'No description provided yet.'
                  : profile?.description || 'No description provided yet.'}
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-sm text-zinc-400 sm:justify-start">
                {profile?.location && (
                  <span>
                    {('city' in profile.location && profile.location.city) || ''}
                    {('country' in profile.location && profile.location.country) &&
                      `, ${profile.location.country}`}
                  </span>
                )}
                {isVenue && typeof (profile as VenueProfile).capacity === 'number' && (
                  <span>Capacity: {(profile as VenueProfile).capacity}</span>
                )}
                {profile?.contactEmail && <span>{profile.contactEmail}</span>}
                {'website' in (profile || {}) && (profile as VenueProfile).website && (
                  <a
                    href={(profile as VenueProfile).website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300"
                  >
                    Website
                  </a>
                )}
              </div>
              <div className="flex justify-center sm:justify-start">
                <Link
                  href={`/profile/${id}/contact`}
                  className="inline-flex items-center justify-center rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
                >
                  Contact
                </Link>
              </div>
            </div>
          </section>

          {(profile?.interests || profile?.genres || profile?.gigTypes) && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                Interests
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile?.interests?.map((tag) => (
                  <Badge key={tag} variant="default">
                    {tag}
                  </Badge>
                ))}
                {!profile?.interests?.length &&
                  (profile as MusicianProfile).genres?.map((g) => (
                    <Badge key={g} variant="default">
                      {g}
                    </Badge>
                  ))}
                {!profile?.interests?.length &&
                  (profile as VenueProfile).gigTypes?.map((g) => (
                    <Badge key={g} variant="default">
                      {g}
                    </Badge>
                  ))}
              </div>
            </section>
          )}

          {profile?.images && profile.images.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                Gallery
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {profile.images.map((url) => (
                  <div
                    key={url}
                    className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800"
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {isVenue && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                  Events
                </h2>
                <Link
                  href="/events"
                  className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  Browse all events →
                </Link>
              </div>
              {venueEvents?.events?.length ? (
                <div className="space-y-2">
                  {venueEvents.events.map((e) => (
                    <Link key={e._id} href={`/events/${e._id}`}>
                      <Card className="hover:border-violet-500/50 transition-colors cursor-pointer">
                        <CardContent className="p-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="font-medium text-zinc-100">{e.title}</div>
                            {e.date && (
                              <div className="text-xs text-zinc-500">
                                {new Date(e.date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <Badge>{e.status}</Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">No public events listed for this venue yet.</p>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
