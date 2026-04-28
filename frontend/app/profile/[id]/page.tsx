'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Header } from '@/components/Layout/Header';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <section className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-violet-600/60 to-fuchsia-500/40 flex items-center justify-center overflow-hidden border border-violet-500/40 shadow-lg shadow-violet-500/20">
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
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-semibold text-zinc-50">
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
              <div className="flex flex-wrap gap-3 text-sm text-zinc-400">
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
              <div>
                <Link href={`/profile/${id}/contact`}>
                  <Button size="sm">Contact</Button>
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
                <Link href="/events">
                  <Button variant="ghost" size="sm">
                    Browse all events
                  </Button>
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
