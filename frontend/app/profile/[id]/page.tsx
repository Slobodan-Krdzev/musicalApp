'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Header } from '@/components/Layout/Header';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

type ProfileRes = {
  user: { _id: string; email: string; role: string };
  profile: Record<string, unknown> | null;
};

export default function ProfilePage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => apiRequest<ProfileRes>(`/api/users/profile/${id}`),
    enabled: !!id,
  });

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

  const isMusician = data.user.role === 'MUSICIAN';
  const profile = data.profile as Record<string, unknown> | null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <h1 className="text-2xl font-bold text-zinc-100">
                {isMusician ? (profile?.bandName as string) || 'Musician' : (profile?.venueName as string) || 'Venue'}
              </h1>
              <Badge>{data.user.role}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {isMusician && profile && (
                <>
                  {profile.bio && <p className="text-zinc-300">{profile.bio as string}</p>}
                  {Array.isArray(profile.genres) && profile.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(profile.genres as string[]).map((g) => (
                        <Badge key={g}>{g}</Badge>
                      ))}
                    </div>
                  )}
                  {profile.location && typeof profile.location === 'object' && (
                    <p className="text-zinc-400 text-sm">
                      {(profile.location as { city?: string; country?: string }).city}
                      {(profile.location as { country?: string }).country &&
                        `, ${(profile.location as { country?: string }).country}`}
                    </p>
                  )}
                  {(profile.contactEmail || profile.contactPhone) && (
                    <p className="text-zinc-400 text-sm">
                      {profile.contactEmail as string} {profile.contactPhone as string}
                    </p>
                  )}
                </>
              )}
              {!isMusician && profile && (
                <>
                  {profile.description && <p className="text-zinc-300">{profile.description as string}</p>}
                  {profile.capacity != null && (
                    <p className="text-zinc-400 text-sm">Capacity: {profile.capacity as number}</p>
                  )}
                  {(profile.contactEmail || profile.website) && (
                    <p className="text-zinc-400 text-sm">
                      {profile.contactEmail as string} {profile.website as string}
                    </p>
                  )}
                </>
              )}
              <Link href={`/profile/${id}/contact`}>
                <Button size="sm">Contact</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
