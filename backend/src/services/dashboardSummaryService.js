import { Event, Offering, Deal, MusicianProfile, VenueProfile } from '../models/index.js';
import { ROLES } from '../models/User.js';

async function resolveFavoritePartner(deals, partnerRole) {
  if (!deals.length) return null;

  const counts = new Map();
  for (const deal of deals) {
    const id = (partnerRole === 'musician' ? deal.musicianId : deal.venueId).toString();
    counts.set(id, (counts.get(id) || 0) + 1);
  }

  let topId = null;
  let topCount = 0;
  for (const [id, count] of counts) {
    if (count > topCount) {
      topCount = count;
      topId = id;
    }
  }

  if (!topId) return null;

  let name = partnerRole === 'musician' ? 'Musician' : 'Venue';
  let avatarUrl = null;

  if (partnerRole === 'musician') {
    const profile = await MusicianProfile.findOne({ userId: topId }).select('bandName avatarUrl').lean();
    name = profile?.bandName || name;
    avatarUrl = profile?.avatarUrl ?? null;
  } else {
    const profile = await VenueProfile.findOne({ userId: topId }).select('venueName avatarUrl').lean();
    name = profile?.venueName || name;
    avatarUrl = profile?.avatarUrl ?? null;
  }

  return {
    userId: topId,
    name,
    type: partnerRole,
    dealCount: topCount,
    avatarUrl,
  };
}

async function buildFinalizedGigRows(completedDeals, viewerRole) {
  if (!completedDeals.length) return [];

  const eventIds = completedDeals.filter((d) => d.entityType === 'EVENT').map((d) => d.entityId);
  const offeringIds = completedDeals.filter((d) => d.entityType === 'OFFERING').map((d) => d.entityId);
  const musicianIds = [...new Set(completedDeals.map((d) => d.musicianId.toString()))];
  const venueIds = [...new Set(completedDeals.map((d) => d.venueId.toString()))];

  const [events, offerings, musicians, venues] = await Promise.all([
    eventIds.length ? Event.find({ _id: { $in: eventIds } }).select('title date').lean() : [],
    offeringIds.length ? Offering.find({ _id: { $in: offeringIds } }).select('title date').lean() : [],
    MusicianProfile.find({ userId: { $in: musicianIds } }).select('userId bandName avatarUrl').lean(),
    VenueProfile.find({ userId: { $in: venueIds } }).select('userId venueName avatarUrl').lean(),
  ]);

  const eventMap = Object.fromEntries(events.map((e) => [e._id.toString(), e]));
  const offeringMap = Object.fromEntries(offerings.map((o) => [o._id.toString(), o]));
  const musicianMap = Object.fromEntries(musicians.map((m) => [m.userId.toString(), m]));
  const venueMap = Object.fromEntries(venues.map((v) => [v.userId.toString(), v]));

  return completedDeals
    .map((deal) => {
      const entity =
        deal.entityType === 'EVENT'
          ? eventMap[deal.entityId.toString()]
          : offeringMap[deal.entityId.toString()];
      const musician = musicianMap[deal.musicianId.toString()];
      const venue = venueMap[deal.venueId.toString()];
      const partnerProfile = viewerRole === ROLES.VENUE ? musician : venue;

      return {
        id: deal._id.toString(),
        title: entity?.title || (deal.entityType === 'EVENT' ? 'Event' : 'Offering'),
        date: entity?.date || null,
        completedAt: deal.updatedAt || deal.createdAt,
        entityType: deal.entityType,
        price: deal.agreedQuote ?? 0,
        partner: {
          userId: (viewerRole === ROLES.VENUE ? deal.musicianId : deal.venueId).toString(),
          name:
            viewerRole === ROLES.VENUE
              ? musician?.bandName || 'Musician'
              : venue?.venueName || 'Venue',
          type: viewerRole === ROLES.VENUE ? 'musician' : 'venue',
          avatarUrl: partnerProfile?.avatarUrl ?? null,
        },
        musicianName: musician?.bandName || 'Musician',
        venueName: venue?.venueName || 'Venue',
      };
    })
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

async function buildSummaryForRole(
  userId,
  role,
  listingsQuery,
  completedDealsQuery,
  listingsLabel,
  partnerRole,
  favoritePartnerLabel
) {
  const [listingsCreated, completedDeals] = await Promise.all([
    listingsQuery,
    Deal.find(completedDealsQuery).lean(),
  ]);

  const favoritePartner = await resolveFavoritePartner(completedDeals, partnerRole);
  const finalizedGigs = await buildFinalizedGigRows(completedDeals, role);
  const approximateRevenue = completedDeals.reduce((sum, d) => sum + (d.agreedQuote || 0), 0);

  const revenueItems = finalizedGigs.map((gig) => ({
    id: gig.id,
    title: gig.title,
    date: gig.date,
    completedAt: gig.completedAt,
    amount: gig.price,
    partnerName: gig.partner.name,
    partnerUserId: gig.partner.userId,
  }));

  return {
    listingsCreated,
    listingsLabel,
    finalizedCount: completedDeals.length,
    approximateRevenue: role === ROLES.MUSICIAN ? approximateRevenue : null,
    showRevenue: role === ROLES.MUSICIAN,
    finalizedGigs,
    revenueItems: role === ROLES.MUSICIAN ? revenueItems : [],
    favoritePartner,
    favoritePartnerLabel,
  };
}

/**
 * Aggregate dashboard activity stats for a musician or venue account.
 */
export async function getDashboardSummary(userId, role) {
  const uid = userId;

  if (role === ROLES.VENUE) {
    return buildSummaryForRole(
      uid,
      role,
      Event.countDocuments({ venueId: uid }),
      { venueId: uid, status: 'COMPLETED' },
      'Events',
      'musician',
      'Favorite musician'
    );
  }

  if (role === ROLES.MUSICIAN) {
    return buildSummaryForRole(
      uid,
      role,
      Offering.countDocuments({ musicianId: uid }),
      { musicianId: uid, status: 'COMPLETED' },
      'Offerings',
      'venue',
      'Favorite venue'
    );
  }

  return null;
}
