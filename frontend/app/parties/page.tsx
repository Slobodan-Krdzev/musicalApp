'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { PublicNavbar } from '@/components/PublicNavbar';
import { SiteFooter } from '@/components/Layout/SiteFooter';
import { SocialLinksChips } from '@/components/SocialLinksChips';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  fetchParties,
  partyDisplayTitle,
  googleMapsDirectionsUrl,
  type PartyItem,
  type PartyFilters,
} from '@/lib/parties';

const PartyMap = dynamic(() => import('@/components/parties/PartyMap'), { ssr: false });

const CLOSEST_RADIUS_KM = 40;
const LOCATION_STORAGE_KEY = 'gigconnection_party_location';

type StoredLocation = { lat: number; lng: number } | 'denied';

function readStoredLocation(): StoredLocation | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
  if (!raw) return null;
  if (raw === 'denied') return 'denied';
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function storeLocation(value: StoredLocation) {
  localStorage.setItem(LOCATION_STORAGE_KEY, value === 'denied' ? 'denied' : JSON.stringify(value));
}

export default function PartiesPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<PartyFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<PartyItem | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'prompt' | 'granted' | 'denied'>('loading');
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    const stored = readStoredLocation();
    if (stored === 'denied') {
      setLocationStatus('denied');
      return;
    }
    if (stored) {
      setUserCoords(stored);
      setLocationStatus('granted');
      return;
    }
    setLocationStatus('prompt');
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      storeLocation('denied');
      setLocationStatus('denied');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        storeLocation(coords);
        setUserCoords(coords);
        setLocationStatus('granted');
        setLocationLoading(false);
      },
      () => {
        storeLocation('denied');
        setLocationStatus('denied');
        setLocationLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  const dismissLocation = useCallback(() => {
    storeLocation('denied');
    setLocationStatus('denied');
  }, []);

  const queryFilters = useMemo(() => {
    const p: PartyFilters = { ...filters, page: String(page), limit: '12' };
    if (searchInput.trim()) p.q = searchInput.trim();
    if (tagsInput.trim()) p.tags = tagsInput.trim();
    return p;
  }, [filters, page, searchInput, tagsInput]);

  const closestFilters = useMemo(() => {
    if (!userCoords) return null;
    return {
      ...queryFilters,
      lat: String(userCoords.lat),
      lng: String(userCoords.lng),
      closest: 'true',
      page: '1',
      limit: '6',
    };
  }, [queryFilters, userCoords]);

  const { data, isLoading } = useQuery({
    queryKey: ['parties', queryFilters],
    queryFn: () => fetchParties(queryFilters),
  });

  const { data: closestData } = useQuery({
    queryKey: ['parties-closest', closestFilters],
    queryFn: () => fetchParties(closestFilters!),
    enabled: !!closestFilters && locationStatus === 'granted',
  });

  const parties = data?.parties ?? [];
  const closestParties = closestData?.parties ?? [];

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchInput.trim()) count++;
    if (tagsInput.trim()) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.timeFrom) count++;
    if (filters.timeTo) count++;
    return count;
  }, [searchInput, tagsInput, filters]);

  function resetFilters() {
    setFilters({});
    setSearchInput('');
    setTagsInput('');
    setPage(1);
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <PublicNavbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-6 sm:px-4 sm:py-8 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-zinc-100 sm:text-2xl">Find a Party</h1>
            <p className="mt-1 text-sm text-zinc-500">Browse finalized live music events and parties near you</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={showMap ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowMap((v) => !v)}
              className="gap-1.5"
              aria-pressed={showMap}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
              Map
            </Button>
            <Button
              variant={filtersOpen ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFiltersOpen((v) => !v)}
              className="relative gap-1.5"
              aria-expanded={filtersOpen}
              aria-controls="party-filters-panel"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-violet-400 px-1 text-[10px] font-bold text-zinc-950">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            {data?.pagination && (
              <span className="text-sm text-zinc-500">
                {data.pagination.total} result{data.pagination.total !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {locationStatus === 'prompt' && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-zinc-900/80 to-zinc-950 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-100">Find parties near you</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Share your location to see &quot;Closest to me&quot; within {CLOSEST_RADIUS_KM} km. We only ask once.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
                <Button variant="secondary" size="sm" onClick={dismissLocation} disabled={locationLoading}>
                  Not now
                </Button>
                <Button size="sm" loading={locationLoading} onClick={requestLocation}>
                  Allow location
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {filtersOpen && (
          <div className="mb-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 sm:mb-8">
            <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2.5 sm:px-4">
              <p className="text-xs font-medium text-zinc-500">
                {activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active` : 'Refine results'}
              </p>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Clear all
                </Button>
              )}
            </div>
            <div
              id="party-filters-panel"
              className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3 xl:grid-cols-4"
            >
          <Input
            label="Search"
            placeholder="Venue, musician, title…"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
          />
          <Input
            label="Tags"
            placeholder="funk, jazz, cover band, dj…"
            value={tagsInput}
            onChange={(e) => {
              setTagsInput(e.target.value);
              setPage(1);
            }}
          />
          <Input
            label="From date"
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(e) => {
              setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }));
              setPage(1);
            }}
          />
          <Input
            label="To date"
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(e) => {
              setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }));
              setPage(1);
            }}
          />
          <Input
            label="From time"
            type="time"
            value={filters.timeFrom ?? ''}
            onChange={(e) => {
              setFilters((f) => ({ ...f, timeFrom: e.target.value || undefined }));
              setPage(1);
            }}
          />
          <Input
            label="To time"
            type="time"
            value={filters.timeTo ?? ''}
            onChange={(e) => {
              setFilters((f) => ({ ...f, timeTo: e.target.value || undefined }));
              setPage(1);
            }}
          />
          <Button variant="secondary" size="md" onClick={resetFilters} className="self-end sm:col-span-2 lg:col-span-1">
            Reset all
          </Button>
            </div>
          </div>
        )}

        {showMap && (
          <div className="mb-8">
            <PartyMap parties={parties} userLat={userCoords?.lat} userLng={userCoords?.lng} />
          </div>
        )}

        {locationStatus === 'granted' && closestParties.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-zinc-100">
              Closest to me
              <span className="ml-2 text-sm font-normal text-zinc-500">within {CLOSEST_RADIUS_KM} km</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {closestParties.map((party) => (
                <PartyCard key={`closest-${party.id}`} party={party} onCardClick={() => setSelectedParty(party)} />
              ))}
            </div>
          </section>
        )}

        {isLoading ? (
          <PartyGridSkeleton />
        ) : parties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg text-zinc-500">No parties found</p>
            <p className="mt-1 text-sm text-zinc-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {parties.map((party) => (
                <PartyCard key={party.id} party={party} onCardClick={() => setSelectedParty(party)} />
              ))}
            </div>

            {data?.pagination && data.pagination.pages > 1 && (
              <div className="mt-10 flex justify-center gap-2">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-zinc-400">
                  {page} / {data.pagination.pages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= data.pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <SiteFooter />

      <PartyDetailModal party={selectedParty} onClose={() => setSelectedParty(null)} />
    </div>
  );
}

function PartyGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="h-52 rounded-t-xl bg-zinc-800" />
          <div className="space-y-3 p-4">
            <div className="h-5 w-3/4 rounded bg-zinc-800" />
            <div className="h-4 w-full rounded bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Interleave venue and musician images for a mixed gallery. */
function buildMixedGallery(party: PartyItem): string[] {
  const venueImgs: string[] = [];
  if (party.venueProfile?.avatarUrl) venueImgs.push(party.venueProfile.avatarUrl);
  if (party.venueProfile?.images?.length) venueImgs.push(...party.venueProfile.images);

  const musicianImgs: string[] = [];
  if (party.musicianProfile?.avatarUrl) musicianImgs.push(party.musicianProfile.avatarUrl);
  if (party.musicianProfile?.images?.length) musicianImgs.push(...party.musicianProfile.images);

  const mixed: string[] = [];
  const max = Math.max(venueImgs.length, musicianImgs.length);
  for (let i = 0; i < max; i++) {
    if (venueImgs[i]) mixed.push(venueImgs[i]);
    if (musicianImgs[i]) mixed.push(musicianImgs[i]);
  }
  return Array.from(new Set(mixed));
}

function formatPartyDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
  };
}

function CollapsibleText({ text, maxLength = 160 }: { text: string; maxLength?: number }) {
  const [expanded, setExpanded] = useState(false);
  const needsToggle = text.length > maxLength;
  const display = !needsToggle || expanded ? text : `${text.slice(0, maxLength).trim()}…`;

  return (
    <div>
      <p className="text-sm leading-relaxed text-zinc-400 whitespace-pre-line">{display}</p>
      {needsToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm font-medium text-violet-400 hover:text-violet-300"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

function PartyCard({ party, onCardClick }: { party: PartyItem; onCardClick: () => void }) {
  const images = buildMixedGallery(party);
  const [currentSlide, setCurrentSlide] = useState(0);
  const displayTitle = partyDisplayTitle(party);
  const { date, time } = party.date ? formatPartyDateTime(party.date) : { date: '', time: '' };

  return (
    <div
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-all duration-300 hover:border-violet-500/40"
      onClick={onCardClick}
    >
      <div className="relative h-52 shrink-0 overflow-hidden bg-zinc-800">
        {images.length > 0 ? (
          <>
            <Image
              src={images[currentSlide]}
              alt={displayTitle}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide((p) => (p - 1 + images.length) % images.length);
                  }}
                  className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide((p) => (p + 1) % images.length);
                  }}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                >
                  ›
                </button>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-700">No image</div>
        )}
      </div>

      <div className="flex min-h-[140px] flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-zinc-100">{displayTitle}</h3>
        {party.date && (
          <div className="mt-2 space-y-0.5 text-sm text-zinc-400">
            <p>{time}</p>
            <p>{date}</p>
          </div>
        )}
        {party.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {party.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-medium text-violet-300"
              >
                {tag}
              </span>
            ))}
            {party.tags.length > 3 && (
              <span className="rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-0.5 text-[11px] text-zinc-400">
                +{party.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PartyDetailModal({ party, onClose }: { party: PartyItem | null; onClose: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setCurrentSlide(0);
  }, [party?.id]);

  if (!party) return null;

  const images = buildMixedGallery(party);
  const displayTitle = partyDisplayTitle(party);
  const { date, time } = party.date ? formatPartyDateTime(party.date) : { date: '', time: '' };
  const directionsUrl = googleMapsDirectionsUrl(party.location);
  const reservationPhone =
    party.venueProfile?.reservationPhone || party.venueProfile?.contactPhone || null;

  return (
    <Modal
      open={!!party}
      onClose={onClose}
      position="center"
      className="max-w-4xl"
      contentClassName="p-0"
    >
      <div>
        {images.length > 0 && (
          <div className="relative h-56 shrink-0 bg-zinc-800 sm:h-64">
            <Image src={images[currentSlide]} alt={displayTitle} fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentSlide((p) => (p - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentSlide((p) => (p + 1) % images.length)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  ›
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}

        {!images.length && (
          <div className="flex shrink-0 items-center justify-end border-b border-zinc-800 px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}

        <div className="p-5 sm:p-6">
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-zinc-100 sm:text-2xl">{displayTitle}</h2>
              {party.date && (
                <div className="mt-2 text-sm text-zinc-400">
                  <p className="font-medium text-zinc-300">{time}</p>
                  <p>{date}</p>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="mb-3 flex items-center gap-3">
                  {party.venueProfile?.avatarUrl ? (
                    <Image
                      src={party.venueProfile.avatarUrl}
                      alt={party.venueName}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-300">
                      {party.venueName[0]?.toUpperCase()}
                    </div>
                  )}
                  <h3 className="font-semibold text-zinc-100">{party.venueName}</h3>
                </div>
                {party.venueProfile?.description ? (
                  <CollapsibleText text={party.venueProfile.description} />
                ) : (
                  <p className="text-sm italic text-zinc-600">No venue description.</p>
                )}
                <SocialLinksChips links={party.venueProfile?.socialLinks} className="mt-3" />
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="mb-3 flex items-center gap-3">
                  {party.musicianProfile?.avatarUrl ? (
                    <Image
                      src={party.musicianProfile.avatarUrl}
                      alt={party.musicianName}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-300">
                      {party.musicianName[0]?.toUpperCase()}
                    </div>
                  )}
                  <h3 className="font-semibold text-zinc-100">{party.musicianName}</h3>
                </div>
                {party.musicianProfile?.bio ? (
                  <CollapsibleText text={party.musicianProfile.bio} />
                ) : (
                  <p className="text-sm italic text-zinc-600">No musician bio.</p>
                )}
                <SocialLinksChips links={party.musicianProfile?.socialLinks} className="mt-3" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {reservationPhone ? (
                <a
                  href={`tel:${reservationPhone.replace(/\s/g, '')}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-violet-500/40 hover:bg-zinc-800"
                >
                  <svg className="h-4 w-4 shrink-0 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.846 1.13a11.042 11.042 0 01-5.516-5.517l1.13-.846a1.125 1.125 0 00.417-1.173l-1.106-4.423A1.125 1.125 0 009.878 3.25H8.506c-1.094 0-1.978.884-1.978 1.978v.072z" />
                  </svg>
                  <span className="truncate">Call {reservationPhone}</span>
                </a>
              ) : (
                <div className="flex w-full items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 px-4 py-3.5 text-sm text-zinc-500">
                  No reservation number
                </div>
              )}
              {directionsUrl ? (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-violet-400"
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  Get directions
                </a>
              ) : (
                <div className="flex w-full items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 px-4 py-3.5 text-sm text-zinc-500">
                  Directions unavailable
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
