'use client';

import Image from 'next/image';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import { CollapsibleText } from '@/components/ui/CollapsibleText';
import 'leaflet/dist/leaflet.css';
import './event-map.css';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

export type EventMapItem = {
  _id: string;
  title: string;
  date?: string;
  approximatePayment?: number;
  venueProfile?: {
    venueName?: string;
    avatarUrl?: string;
    description?: string;
    location?: { latitude?: number; longitude?: number; city?: string; country?: string };
  } | null;
};

function FitBounds({ events }: { events: EventMapItem[] }) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = events
      .filter((e) => e.venueProfile?.location?.latitude != null && e.venueProfile?.location?.longitude != null)
      .map((e) => [e.venueProfile!.location!.latitude!, e.venueProfile!.location!.longitude!]);

    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
  }, [map, events]);

  return null;
}

function EventMapPopup({ event }: { event: EventMapItem }) {
  const venueName = event.venueProfile?.venueName || 'Venue';
  const avatarUrl = event.venueProfile?.avatarUrl;
  const locationLabel = [event.venueProfile?.location?.city, event.venueProfile?.location?.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="event-map-popup__card">
      <div className="flex gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={venueName} fill className="object-cover" unoptimized />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-bold text-zinc-400">
              {venueName[0]?.toUpperCase() || '?'}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-zinc-100">{event.title}</p>
          <p className="truncate text-xs font-medium text-violet-300">{venueName}</p>
          {locationLabel && <p className="truncate text-[11px] text-zinc-500">{locationLabel}</p>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {event.date && (
          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
            <svg className="h-3 w-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            {new Date(event.date).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
        {event.approximatePayment != null && (
          <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
            ~€{event.approximatePayment}
          </span>
        )}
      </div>

      {event.venueProfile?.description ? (
        <div className="mt-3 border-t border-zinc-800 pt-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">About the venue</p>
          <CollapsibleText text={event.venueProfile.description} maxLength={100} />
        </div>
      ) : null}
    </div>
  );
}

export default function EventMap({ events }: { events: EventMapItem[] }) {
  const pinned = events.filter(
    (e) => e.venueProfile?.location?.latitude != null && e.venueProfile?.location?.longitude != null
  );
  const defaultCenter: [number, number] = pinned.length
    ? [pinned[0].venueProfile!.location!.latitude!, pinned[0].venueProfile!.location!.longitude!]
    : [41.9981, 21.4254];

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800" style={{ height: 420 }}>
      {pinned.length === 0 ? (
        <div className="flex h-full items-center justify-center bg-zinc-900 px-6 text-center text-sm text-zinc-500">
          No events with venue locations to show on the map yet.
        </div>
      ) : (
        <MapContainer center={defaultCenter} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds events={pinned} />
          {pinned.map((event) => (
            <Marker
              key={event._id}
              position={[event.venueProfile!.location!.latitude!, event.venueProfile!.location!.longitude!]}
            >
              <Popup className="event-map-popup" minWidth={280} maxWidth={300}>
                <EventMapPopup event={event} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}
