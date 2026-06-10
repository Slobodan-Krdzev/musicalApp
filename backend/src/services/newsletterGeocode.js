/**
 * Geocode a free-text location label via OpenStreetMap Nominatim (no API key).
 * Used when the subscriber types a city/region instead of using GPS.
 */
export async function geocodeLocationLabel(label) {
  const query = String(label || '').trim();
  if (query.length < 2) return null;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('q', query);

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'GigConnection/1.0 (newsletter; contact@connectiongig.com)' },
  });

  if (!res.ok) return null;

  const results = await res.json();
  const hit = results?.[0];
  if (!hit) return null;

  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  const address = hit.address || {};
  return {
    latitude: lat,
    longitude: lng,
    city: address.city || address.town || address.village || address.municipality || null,
    region: address.state || address.region || address.county || null,
    country: address.country || null,
    displayName: hit.display_name || query,
  };
}
