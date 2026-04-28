'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Layout/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

type MusicianProfileData = {
  bandName?: string;
  avatarUrl?: string;
  images?: string[];
  genres?: string[];
  interests?: string[];
  location?: { city?: string; region?: string; country?: string };
};

type OfferingItem = {
  _id: string;
  title: string;
  description?: string;
  date?: string;
  activeTo?: string;
  lookingFor?: string[];
  approximatePrice?: number;
  paymentType?: string;
  genres?: string[];
  interests?: string[];
  status: string;
  musicianProfile?: MusicianProfileData | null;
};

type Res = {
  offerings: OfferingItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

export default function OfferingsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{ genre?: string; lookingFor?: string; dateFrom?: string; dateTo?: string }>({});
  const [selectedOffering, setSelectedOffering] = useState<OfferingItem | null>(null);

  const isVenue = user?.role === 'VENUE';

  const params: Record<string, string> = { page: String(page), limit: '12' };
  if (filters.genre) params.genre = filters.genre;
  if (filters.lookingFor) params.lookingFor = filters.lookingFor;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;

  const { data, isLoading } = useQuery({
    queryKey: ['offerings', page, filters],
    queryFn: () => apiRequest<Res>('/api/offerings', { params }),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">Please log in to view offerings.</p>
        </main>
      </div>
    );
  }

  if (!isVenue) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-zinc-200 mb-2">Musician Offerings</h2>
            <p className="text-zinc-500">Only venues can browse musician offerings.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Browse Offerings</h1>
            <p className="text-zinc-500 text-sm mt-1">Find available musicians for your venue</p>
          </div>
          {data?.pagination && (
            <span className="text-zinc-500 text-sm">{data.pagination.total} offering{data.pagination.total !== 1 ? 's' : ''} found</span>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 mb-8">
          <Input
            label="Genre"
            placeholder="e.g. Rock"
            value={filters.genre ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, genre: e.target.value || undefined }))}
            className="min-w-[140px]"
          />
          <Input
            label="Looking For"
            placeholder="e.g. Wedding Gig"
            value={filters.lookingFor ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, lookingFor: e.target.value || undefined }))}
            className="min-w-[160px]"
          />
          <Input
            label="From date"
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))}
            className="min-w-[140px]"
          />
          <Input
            label="To date"
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))}
            className="min-w-[140px]"
          />
          <Button variant="secondary" size="md" onClick={() => { setFilters({}); setPage(1); }}>
            Reset
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse">
                <div className="h-52 bg-zinc-800 rounded-t-xl" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-zinc-800 rounded w-3/4" />
                  <div className="h-4 bg-zinc-800 rounded w-full" />
                  <div className="h-4 bg-zinc-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.offerings?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="w-16 h-16 text-zinc-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
            </svg>
            <p className="text-zinc-500 text-lg mb-1">No offerings available</p>
            <p className="text-zinc-600 text-sm">Check back later for new musician availability</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data?.offerings?.map((offering) => (
                <OfferingCard
                  key={offering._id}
                  offering={offering}
                  onCardClick={() => setSelectedOffering(offering)}
                />
              ))}
            </div>

            {data?.pagination && data.pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="flex items-center px-4 text-zinc-400 text-sm">
                  {page} / {data.pagination.pages}
                </span>
                <Button variant="secondary" size="sm" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <OfferingDetailModal
        offering={selectedOffering}
        onClose={() => setSelectedOffering(null)}
      />
    </div>
  );
}

function OfferingCard({
  offering,
  onCardClick,
}: {
  offering: OfferingItem;
  onCardClick: () => void;
}) {
  const router = useRouter();
  const images = buildGallery(offering);
  const [currentSlide, setCurrentSlide] = useState(0);

  function nextSlide(e: React.MouseEvent) {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % images.length);
  }
  function prevSlide(e: React.MouseEvent) {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  }

  const bandName = offering.musicianProfile?.bandName || 'Unknown Artist';
  const avatarUrl = offering.musicianProfile?.avatarUrl;
  const location = offering.musicianProfile?.location;
  const locationStr = [location?.city, location?.country].filter(Boolean).join(', ');

  return (
    <div
      className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden hover:border-violet-500/40 transition-all duration-300 cursor-pointer group"
      onClick={onCardClick}
    >
      <div className="relative h-52 bg-zinc-800 overflow-hidden">
        {images.length > 0 ? (
          <>
            <Image
              src={images[currentSlide]}
              alt={offering.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            {images.length > 1 && (
              <>
                <button type="button" onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button type="button" onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, idx) => (
                    <span key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentSlide ? 'bg-white' : 'bg-white/40'}`} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
            </svg>
          </div>
        )}

        <div className="absolute bottom-3 left-4 flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full border-2 border-white/30 overflow-hidden bg-zinc-700 flex-shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={bandName} width={40} height={40} className="object-cover" unoptimized />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-white text-sm font-bold">
                {bandName[0]?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div>
            <p className="text-white text-sm font-semibold drop-shadow-lg">{bandName}</p>
            {locationStr && <p className="text-white/70 text-xs drop-shadow">{locationStr}</p>}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-zinc-100 font-semibold text-base line-clamp-1 flex-1">{offering.title}</h3>
          <Badge variant="success" className="flex-shrink-0 text-[10px]">{offering.status}</Badge>
        </div>

        {offering.description && (
          <p className="text-zinc-400 text-sm line-clamp-2">{offering.description}</p>
        )}

        {offering.genres && offering.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {offering.genres.slice(0, 4).map((g) => (
              <span key={g} className="px-1.5 py-0.5 rounded text-[10px] bg-violet-500/10 text-violet-300 border border-violet-500/20">{g}</span>
            ))}
            {offering.genres.length > 4 && <span className="text-[10px] text-zinc-500">+{offering.genres.length - 4}</span>}
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-zinc-500">
          {offering.date && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              {new Date(offering.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
          {offering.approximatePrice != null && (
            <span className="flex items-center gap-1 text-emerald-400">€{offering.approximatePrice}</span>
          )}
        </div>

        <Button
          size="sm"
          className="w-full mt-2"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/offerings/${offering._id}/apply`);
          }}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}

function OfferingDetailModal({
  offering,
  onClose,
}: {
  offering: OfferingItem | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => { setCurrentSlide(0); }, [offering?._id]);

  if (!offering) return null;

  const images = buildGallery(offering);
  const bandName = offering.musicianProfile?.bandName || 'Unknown Artist';
  const avatarUrl = offering.musicianProfile?.avatarUrl;
  const location = offering.musicianProfile?.location;
  const locationStr = [location?.city, location?.region, location?.country].filter(Boolean).join(', ');

  return (
    <Modal open={!!offering} onClose={onClose} className="max-w-2xl !p-0">
      <div className="overflow-hidden rounded-xl">
        <div className="relative h-64 sm:h-72 bg-zinc-800">
          {images.length > 0 ? (
            <>
              <Image src={images[currentSlide]} alt={offering.title} fill className="object-cover" unoptimized sizes="672px" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              {images.length > 1 && (
                <>
                  <button type="button" onClick={() => setCurrentSlide((p) => (p - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button type="button" onClick={() => setCurrentSlide((p) => (p + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, idx) => (
                      <button key={idx} type="button" onClick={() => setCurrentSlide(idx)} className={`w-2 h-2 rounded-full transition-colors ${idx === currentSlide ? 'bg-white' : 'bg-white/40'}`} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-16 h-16 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
              </svg>
            </div>
          )}

          <div className="absolute bottom-4 left-5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-white/40 overflow-hidden bg-zinc-700 flex-shrink-0">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={bandName} width={48} height={48} className="object-cover" unoptimized />
              ) : (
                <span className="flex items-center justify-center w-full h-full text-white text-lg font-bold">{bandName[0]?.toUpperCase() || '?'}</span>
              )}
            </div>
            <div>
              <p className="text-white font-semibold drop-shadow-lg">{bandName}</p>
              {locationStr && <p className="text-white/70 text-sm drop-shadow">{locationStr}</p>}
            </div>
          </div>

          <button type="button" onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold text-zinc-100">{offering.title}</h2>
            <Badge variant="success">{offering.status}</Badge>
          </div>

          {offering.description && (
            <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">{offering.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {offering.date && (
              <div className="rounded-lg bg-zinc-800/50 p-3">
                <span className="text-xs text-zinc-500 font-medium block mb-0.5">Available Date</span>
                <span className="text-sm text-zinc-200">
                  {new Date(offering.date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
            {offering.activeTo && (
              <div className="rounded-lg bg-zinc-800/50 p-3">
                <span className="text-xs text-zinc-500 font-medium block mb-0.5">Active Until</span>
                <span className="text-sm text-zinc-200">
                  {new Date(offering.activeTo).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>

          {offering.genres && offering.genres.length > 0 && (
            <div>
              <span className="text-xs text-zinc-500 font-medium block mb-1.5">Genres</span>
              <div className="flex flex-wrap gap-1.5">
                {offering.genres.map((g) => <Badge key={g} variant="default">{g}</Badge>)}
              </div>
            </div>
          )}

          {offering.interests && offering.interests.length > 0 && (
            <div>
              <span className="text-xs text-zinc-500 font-medium block mb-1.5">Interests</span>
              <div className="flex flex-wrap gap-1.5">
                {offering.interests.map((i) => <Badge key={i} variant="warning">{i}</Badge>)}
              </div>
            </div>
          )}

          {offering.lookingFor && offering.lookingFor.length > 0 && (
            <div>
              <span className="text-xs text-zinc-500 font-medium block mb-1.5">Looking For</span>
              <div className="flex flex-wrap gap-1.5">
                {offering.lookingFor.map((tag) => <Badge key={tag} variant="default">{tag}</Badge>)}
              </div>
            </div>
          )}

          {(offering.approximatePrice != null || offering.paymentType) && (
            <div className="flex items-center gap-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
              <div>
                {offering.approximatePrice != null && (
                  <span className="text-emerald-300 font-semibold">~€{offering.approximatePrice}</span>
                )}
                {offering.paymentType && (
                  <span className="text-zinc-400 text-sm ml-2">({offering.paymentType})</span>
                )}
              </div>
            </div>
          )}

          <Button size="md" className="w-full" onClick={() => router.push(`/offerings/${offering._id}/apply`)}>
            Apply for this Musician
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function buildGallery(offering: OfferingItem): string[] {
  const imgs: string[] = [];
  if (offering.musicianProfile?.images?.length) {
    imgs.push(...offering.musicianProfile.images);
  }
  if (offering.musicianProfile?.avatarUrl && !imgs.includes(offering.musicianProfile.avatarUrl)) {
    imgs.unshift(offering.musicianProfile.avatarUrl);
  }
  return imgs;
}
