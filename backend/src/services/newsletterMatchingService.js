import { DEFAULT_NEWSLETTER_RADIUS_KM } from '../constants/newsletterGenres.js';
import { isExcludedPublicParty } from './partyPublicFilters.js';

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizeTag(value) {
  return String(value || '').trim().toLowerCase();
}

function partyTagSet(party) {
  const tags = [...(party.tags || [])];
  if (party.musicianProfile?.genres) tags.push(...party.musicianProfile.genres);
  return tags.map(normalizeTag).filter(Boolean);
}

function matchesGenres(party, prefs) {
  const wanted = (prefs.genres || []).map(normalizeTag).filter(Boolean);
  if (!wanted.length) return true;

  const tags = partyTagSet(party);
  return wanted.some((genre) =>
    tags.some((tag) => tag.includes(genre) || genre.includes(tag))
  );
}

function textLocationMatch(party, prefs) {
  const label = normalizeTag(prefs.locationLabel);
  if (!label) return false;

  const area = party.locationArea || {};
  const haystack = [area.city, area.region, area.country].map(normalizeTag).filter(Boolean).join(' ');
  if (!haystack) return false;

  const terms = label.split(/[,|/]+/).map((t) => t.trim()).filter(Boolean);
  if (!terms.length) return label.length >= 2 && haystack.includes(label);

  return terms.some((term) => haystack.includes(term) || term.split(/\s+/).some((word) => word.length > 2 && haystack.includes(word)));
}

function matchesLocation(party, prefs) {
  const radiusKm = prefs.radiusKm || DEFAULT_NEWSLETTER_RADIUS_KM;
  const subLat = prefs.latitude;
  const subLng = prefs.longitude;
  const partyLat = party.location?.latitude;
  const partyLng = party.location?.longitude;

  if (subLat != null && subLng != null && partyLat != null && partyLng != null) {
    return haversineKm(subLat, subLng, partyLat, partyLng) <= radiusKm;
  }

  return textLocationMatch(party, prefs);
}

/** Returns true when a party should appear in this subscriber's digest. */
export function partyMatchesSubscriber(party, subscriber) {
  const prefs = subscriber.preferences || {};
  if (!prefs.locationLabel && prefs.latitude == null) return false;
  if (isExcludedPublicParty(party)) return false;
  if (!matchesGenres(party, prefs)) return false;
  return matchesLocation(party, prefs);
}

export function filterPartiesForSubscriber(parties, subscriber) {
  const prefs = subscriber.preferences || {};
  const subLat = prefs.latitude;
  const subLng = prefs.longitude;

  return parties
    .filter((party) => partyMatchesSubscriber(party, subscriber))
    .map((party) => {
      let distanceKm = party.distanceKm ?? null;
      if (subLat != null && subLng != null && party.location?.latitude != null && party.location?.longitude != null) {
        distanceKm = haversineKm(subLat, subLng, party.location.latitude, party.location.longitude);
      }
      return { ...party, distanceKm };
    })
    .sort((a, b) => {
      const dateDiff = new Date(a.date) - new Date(b.date);
      if (dateDiff !== 0) return dateDiff;
      return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
    });
}
