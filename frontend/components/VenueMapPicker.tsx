'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type VenueMapPickerProps = {
  lat?: number;
  lng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
};

export default function VenueMapPicker({ lat, lng, onLocationSelect }: VenueMapPickerProps) {
  const center: [number, number] = [lat || 48.8566, lng || 2.3522];

  return (
    <div className="rounded-lg overflow-hidden border border-zinc-700" style={{ height: 320 }}>
      <MapContainer
        center={center}
        zoom={lat ? 13 : 4}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onLocationSelect={onLocationSelect} />
        {lat != null && lng != null && <Marker position={[lat, lng]} />}
      </MapContainer>
    </div>
  );
}
