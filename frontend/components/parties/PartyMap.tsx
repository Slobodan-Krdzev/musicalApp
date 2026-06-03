'use client';

import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import type { PartyItem } from '@/lib/parties';

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

function FitBounds({
  parties,
  userLat,
  userLng,
}: {
  parties: PartyItem[];
  userLat?: number | null;
  userLng?: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = parties
      .filter((p) => p.location?.latitude != null && p.location?.longitude != null)
      .map((p) => [p.location!.latitude!, p.location!.longitude!]);

    if (userLat != null && userLng != null) points.push([userLat, userLng]);
    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
  }, [map, parties, userLat, userLng]);

  return null;
}

type PartyMapProps = {
  parties: PartyItem[];
  userLat?: number | null;
  userLng?: number | null;
};

export default function PartyMap({ parties, userLat, userLng }: PartyMapProps) {
  const pinned = parties.filter((p) => p.location?.latitude != null && p.location?.longitude != null);
  const defaultCenter: [number, number] =
    userLat != null && userLng != null ? [userLat, userLng] : [48.8566, 2.3522];

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800" style={{ height: 420 }}>
      <MapContainer center={defaultCenter} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds parties={pinned} userLat={userLat} userLng={userLng} />
        {userLat != null && userLng != null && (
          <CircleMarker
            center={[userLat, userLng]}
            radius={10}
            pathOptions={{ color: '#6366f1', fillColor: '#818cf8', fillOpacity: 0.9, weight: 2 }}
          >
            <Popup>You are here</Popup>
          </CircleMarker>
        )}
        {pinned.map((party) => (
          <Marker
            key={party.id}
            position={[party.location!.latitude!, party.location!.longitude!]}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{party.title}</p>
                <p className="text-zinc-600">{party.venueName}</p>
                <p className="text-zinc-600">{party.musicianName}</p>
                {party.date && (
                  <p className="mt-1 text-zinc-500">
                    {new Date(party.date).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
