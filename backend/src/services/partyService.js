import { Deal, Event, Offering, MusicianProfile, VenueProfile } from '../models/index.js';
import { notifyNewsletterNewParty } from './newsletterService.js';

const CLOSEST_RADIUS_KM = 40;

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseTimeToMinutes(value) {
  if (!value) return null;
  const [h, m] = String(value).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function dateTimeMinutes(date) {
  const d = new Date(date);
  return d.getHours() * 60 + d.getMinutes();
}

function matchesTimeRange(date, timeFrom, timeTo) {
  const mins = dateTimeMinutes(date);
  const from = parseTimeToMinutes(timeFrom);
  const to = parseTimeToMinutes(timeTo);
  if (from != null && mins < from) return false;
  if (to != null && mins > to) return false;
  return true;
}

function collectTags(entity, musicianProfile, venueProfile) {
  return [
    ...(entity?.lookingFor || []),
    ...(entity?.genres || []),
    ...(entity?.interests || []),
    ...(musicianProfile?.genres || []),
    ...(musicianProfile?.interests || []),
    ...(musicianProfile?.services || []),
    ...(venueProfile?.gigTypes || []),
    ...(venueProfile?.interests || []),
  ]
    .filter(Boolean)
    .map((t) => String(t).trim())
    .filter(Boolean);
}

function publicLocation(loc) {
  if (!loc) return null;
  if (loc.latitude == null && loc.longitude == null) return null;
  return {
    latitude: loc.latitude ?? undefined,
    longitude: loc.longitude ?? undefined,
  };
}

/**
 * List publicly visible finalized parties (completed deals on AGREED entities).
 */
export async function listPublicParties(query = {}) {
  const {
    q,
    tags,
    dateFrom,
    dateTo,
    timeFrom,
    timeTo,
    lat,
    lng,
    closest,
    page = 1,
    limit = 12,
  } = query;

  const deals = await Deal.find({ status: 'COMPLETED' }).sort({ updatedAt: -1 }).lean();
  if (!deals.length) {
    return { parties: [], pagination: { page: 1, limit, total: 0, pages: 0 } };
  }

  const eventIds = deals.filter((d) => d.entityType === 'EVENT').map((d) => d.entityId);
  const offeringIds = deals.filter((d) => d.entityType === 'OFFERING').map((d) => d.entityId);
  const musicianIds = [...new Set(deals.map((d) => d.musicianId.toString()))];
  const venueIds = [...new Set(deals.map((d) => d.venueId.toString()))];

  const [events, offerings, musicianProfiles, venueProfiles] = await Promise.all([
    eventIds.length ? Event.find({ _id: { $in: eventIds }, status: 'AGREED' }).lean() : [],
    offeringIds.length ? Offering.find({ _id: { $in: offeringIds }, status: 'AGREED' }).lean() : [],
    MusicianProfile.find({ userId: { $in: musicianIds } }).lean(),
    VenueProfile.find({ userId: { $in: venueIds } }).lean(),
  ]);

  const eventMap = Object.fromEntries(events.map((e) => [e._id.toString(), e]));
  const offeringMap = Object.fromEntries(offerings.map((o) => [o._id.toString(), o]));
  const musicianMap = Object.fromEntries(musicianProfiles.map((m) => [m.userId.toString(), m]));
  const venueMap = Object.fromEntries(venueProfiles.map((v) => [v.userId.toString(), v]));

  const userLat = lat != null ? Number(lat) : null;
  const userLng = lng != null ? Number(lng) : null;
  const hasUserCoords = userLat != null && userLng != null && !Number.isNaN(userLat) && !Number.isNaN(userLng);

  let parties = [];

  for (const deal of deals) {
    const entity =
      deal.entityType === 'EVENT'
        ? eventMap[deal.entityId.toString()]
        : offeringMap[deal.entityId.toString()];
    if (!entity?.date) continue;

    const musicianProfile = musicianMap[deal.musicianId.toString()] || null;
    const venueProfile = venueMap[deal.venueId.toString()] || null;
    const tagList = collectTags(entity, musicianProfile, venueProfile);
    const loc = venueProfile?.location;
    const latitude = loc?.latitude;
    const longitude = loc?.longitude;

    let distanceKm = null;
    if (hasUserCoords && latitude != null && longitude != null) {
      distanceKm = haversineKm(userLat, userLng, latitude, longitude);
    }

    parties.push({
      id: deal._id.toString(),
      entityType: deal.entityType,
      entityId: entity._id.toString(),
      title: entity.title,
      description: entity.description || '',
      date: entity.date,
      tags: tagList,
      venueName: venueProfile?.venueName || 'Venue',
      musicianName: musicianProfile?.bandName || 'Musician',
      venueProfile: venueProfile
        ? {
            avatarUrl: venueProfile.avatarUrl,
            images: venueProfile.images || [],
            description: venueProfile.description || '',
            socialLinks: venueProfile.socialLinks || {},
            contactPhone: venueProfile.contactPhone || null,
            reservationPhone: venueProfile.reservationPhone || null,
          }
        : null,
      musicianProfile: musicianProfile
        ? {
            avatarUrl: musicianProfile.avatarUrl,
            images: musicianProfile.images || [],
            bio: musicianProfile.bio || '',
            genres: musicianProfile.genres || [],
            socialLinks: musicianProfile.socialLinks || {},
          }
        : null,
      location: publicLocation(loc),
      distanceKm,
    });
  }

  if (q) {
    const term = q.toLowerCase().trim();
    parties = parties.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.venueName.toLowerCase().includes(term) ||
        p.musicianName.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.tags.some((t) => t.toLowerCase().includes(term))
    );
  }

  if (tags) {
    const wanted = tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (wanted.length) {
      parties = parties.filter((p) =>
        wanted.some((w) => p.tags.some((t) => t.toLowerCase().includes(w)))
      );
    }
  }

  if (dateFrom) {
    const from = new Date(dateFrom);
    parties = parties.filter((p) => new Date(p.date) >= from);
  }
  if (dateTo) {
    const to = new Date(`${dateTo}T23:59:59.999`);
    parties = parties.filter((p) => new Date(p.date) <= to);
  }

  if (timeFrom || timeTo) {
    parties = parties.filter((p) => matchesTimeRange(p.date, timeFrom, timeTo));
  }

  if (closest === 'true' || closest === true) {
    if (hasUserCoords) {
      parties = parties.filter((p) => p.distanceKm != null && p.distanceKm <= CLOSEST_RADIUS_KM);
      parties.sort((a, b) => a.distanceKm - b.distanceKm);
    }
  } else {
    parties.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  const total = parties.length;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 12));
  const skip = (pageNum - 1) * limitNum;
  const paged = parties.slice(skip, skip + limitNum);

  return {
    parties: paged,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 0,
    },
    closestRadiusKm: CLOSEST_RADIUS_KM,
  };
}

/** Notify newsletter subscribers after a deal is finalized. */
export async function notifyFinalizedDeal(dealId) {
  const result = await listPublicParties({ limit: 1000 });
  const party = result.parties.find((p) => p.id === dealId.toString());
  if (party) await notifyNewsletterNewParty(party);
}

export { CLOSEST_RADIUS_KM };
