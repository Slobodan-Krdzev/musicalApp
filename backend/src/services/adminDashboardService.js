import {
  User,
  Event,
  Offering,
  Application,
  Deal,
  Subscription,
  MusicianProfile,
  VenueProfile,
  NewsletterSubscriber,
  ROLES,
} from '../models/index.js';
import { countPendingSupportTickets } from '../services/supportService.js';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildTextFilter(q) {
  if (!q || !q.trim()) return null;
  const regex = new RegExp(escapeRegex(q.trim()), 'i');
  return regex;
}

async function findUserIdsMatchingProfileSearch(regex) {
  const [musicians, venues] = await Promise.all([
    MusicianProfile.find({ bandName: regex }).select('userId').lean(),
    VenueProfile.find({ venueName: regex }).select('userId').lean(),
  ]);
  return [...musicians.map((m) => m.userId), ...venues.map((v) => v.userId)];
}

export async function getEnhancedStats() {
  const [
    totalUsers,
    musicians,
    venues,
    activeSubscriptions,
    events,
    offerings,
    applications,
    deals,
    completedDeals,
    newsletterSubscribers,
    revenueAgg,
    openSupportTickets,
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: ROLES.SUPERADMIN } }),
    User.countDocuments({ role: ROLES.MUSICIAN, isSuspended: false }),
    User.countDocuments({ role: ROLES.VENUE, isSuspended: false }),
    Subscription.countDocuments({ status: { $in: ['active', 'trialing'] } }),
    Event.countDocuments(),
    Offering.countDocuments(),
    Application.countDocuments(),
    Deal.countDocuments(),
    Deal.countDocuments({ status: 'COMPLETED' }),
    NewsletterSubscriber.countDocuments(),
    Deal.aggregate([
      { $match: { status: 'COMPLETED', agreedQuote: { $ne: null } } },
      { $group: { _id: null, total: { $sum: '$agreedQuote' } } },
    ]),
    countPendingSupportTickets(),
  ]);

  const dealStats = await Deal.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        revenue: { $sum: { $ifNull: ['$agreedQuote', 0] } },
      },
    },
  ]);

  const byStatus = Object.fromEntries(dealStats.map((d) => [d._id, { count: d.count, revenue: d.revenue }]));

  return {
    totalUsers,
    musicians,
    venues,
    activeSubscriptions,
    events,
    offerings,
    applications,
    deals,
    completedDeals,
    newsletterSubscribers,
    platformRevenue: revenueAgg[0]?.total ?? 0,
    dealsByStatus: byStatus,
    openSupportTickets,
  };
}

export async function adminSearch(q, type = 'all', limit = 20) {
  const regex = buildTextFilter(q);
  if (!regex) {
    return { users: [], events: [], offerings: [], deals: [], subscribers: [] };
  }

  const cap = Math.min(Number(limit) || 20, 50);
  const types = type === 'all' ? ['users', 'events', 'offerings', 'deals', 'subscribers'] : [type];

  const profileUserIds = await findUserIdsMatchingProfileSearch(regex);

  const results = {};

  if (types.includes('users')) {
    results.users = await User.find({
      role: { $ne: ROLES.SUPERADMIN },
      $or: [{ email: regex }, ...(profileUserIds.length ? [{ _id: { $in: profileUserIds } }] : [])],
    })
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .limit(cap)
      .lean();
  } else {
    results.users = [];
  }

  if (types.includes('events')) {
    results.events = await Event.find({
      $or: [{ title: regex }, { description: regex }],
    })
      .populate('venueId', 'email')
      .sort({ createdAt: -1 })
      .limit(cap)
      .lean();
  } else {
    results.events = [];
  }

  if (types.includes('offerings')) {
    results.offerings = await Offering.find({
      $or: [{ title: regex }, { description: regex }],
    })
      .populate('musicianId', 'email')
      .sort({ createdAt: -1 })
      .limit(cap)
      .lean();
  } else {
    results.offerings = [];
  }

  if (types.includes('deals')) {
    const deals = await Deal.find()
      .populate('musicianId', 'email')
      .populate('venueId', 'email')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const eventIds = deals.filter((d) => d.entityType === 'EVENT').map((d) => d.entityId);
    const offeringIds = deals.filter((d) => d.entityType === 'OFFERING').map((d) => d.entityId);
    const [events, offerings] = await Promise.all([
      eventIds.length ? Event.find({ _id: { $in: eventIds }, title: regex }).select('_id title').lean() : [],
      offeringIds.length ? Offering.find({ _id: { $in: offeringIds }, title: regex }).select('_id title').lean() : [],
    ]);
    const matchIds = new Set([...events.map((e) => e._id.toString()), ...offerings.map((o) => o._id.toString())]);
    results.deals = deals
      .filter((d) => matchIds.has(d.entityId.toString()))
      .slice(0, cap);
  } else {
    results.deals = [];
  }

  if (types.includes('subscribers')) {
    results.subscribers = await NewsletterSubscriber.find({ email: regex })
      .sort({ createdAt: -1 })
      .limit(cap)
      .lean();
  } else {
    results.subscribers = [];
  }

  return results;
}

export async function listCustomers({ q, role, page = 1, limit = 25 }) {
  const regex = buildTextFilter(q);
  const filter = { role: { $ne: ROLES.SUPERADMIN } };
  if (role && role !== 'ALL') filter.role = role;

  if (regex) {
    const profileUserIds = await findUserIdsMatchingProfileSearch(regex);
    filter.$or = [{ email: regex }, ...(profileUserIds.length ? [{ _id: { $in: profileUserIds } }] : [])];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 25));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(filter).select('-password -refreshToken').sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    User.countDocuments(filter),
  ]);

  if (!users.length) {
    return { customers: [], pagination: { page: pageNum, limit: limitNum, total, pages: 0 } };
  }

  const userIds = users.map((u) => u._id);

  const [musicianProfiles, venueProfiles, subscriptions, eventsByVenue, offeringsByMusician, dealsAsMusician, dealsAsVenue] =
    await Promise.all([
      MusicianProfile.find({ userId: { $in: userIds } }).lean(),
      VenueProfile.find({ userId: { $in: userIds } }).lean(),
      Subscription.find({ userId: { $in: userIds } }).lean(),
      Event.aggregate([
        { $match: { venueId: { $in: userIds } } },
        { $group: { _id: '$venueId', count: { $sum: 1 } } },
      ]),
      Offering.aggregate([
        { $match: { musicianId: { $in: userIds } } },
        { $group: { _id: '$musicianId', count: { $sum: 1 } } },
      ]),
      Deal.aggregate([
        { $match: { musicianId: { $in: userIds }, status: 'COMPLETED' } },
        { $group: { _id: '$musicianId', count: { $sum: 1 }, revenue: { $sum: { $ifNull: ['$agreedQuote', 0] } } } },
      ]),
      Deal.aggregate([
        { $match: { venueId: { $in: userIds }, status: 'COMPLETED' } },
        { $group: { _id: '$venueId', count: { $sum: 1 }, spent: { $sum: { $ifNull: ['$agreedQuote', 0] } } } },
      ]),
    ]);

  const musicianMap = Object.fromEntries(musicianProfiles.map((p) => [p.userId.toString(), p]));
  const venueMap = Object.fromEntries(venueProfiles.map((p) => [p.userId.toString(), p]));
  const subMap = Object.fromEntries(subscriptions.map((s) => [s.userId.toString(), s]));
  const eventCountMap = Object.fromEntries(eventsByVenue.map((e) => [e._id.toString(), e.count]));
  const offeringCountMap = Object.fromEntries(offeringsByMusician.map((o) => [o._id.toString(), o.count]));
  const musicianDealMap = Object.fromEntries(dealsAsMusician.map((d) => [d._id.toString(), d]));
  const venueDealMap = Object.fromEntries(dealsAsVenue.map((d) => [d._id.toString(), d]));

  const customers = users.map((u) => {
    const id = u._id.toString();
    const musician = musicianMap[id];
    const venue = venueMap[id];
    const sub = subMap[id];
    const mDeals = musicianDealMap[id];
    const vDeals = venueDealMap[id];

    return {
      ...u,
      displayName:
        u.role === ROLES.MUSICIAN
          ? musician?.bandName || u.email
          : u.role === ROLES.VENUE
            ? venue?.venueName || u.email
            : u.email,
      profileId: id,
      eventsCount: u.role === ROLES.VENUE ? eventCountMap[id] || 0 : 0,
      offeringsCount: u.role === ROLES.MUSICIAN ? offeringCountMap[id] || 0 : 0,
      completedDeals: (mDeals?.count || 0) + (vDeals?.count || 0),
      revenue: mDeals?.revenue || 0,
      spend: vDeals?.spent || 0,
      subscription: sub
        ? {
            planId: sub.planId,
            status: sub.status,
            currentPeriodEnd: sub.currentPeriodEnd,
          }
        : null,
    };
  });

  return {
    customers,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  };
}

export async function listDealsAdmin({ q, status, page = 1, limit = 25 }) {
  const filter = {};
  if (status && status !== 'ALL') filter.status = status;

  const regex = buildTextFilter(q);
  let entityIds = null;
  if (regex) {
    const [events, offerings] = await Promise.all([
      Event.find({ title: regex }).select('_id').lean(),
      Offering.find({ title: regex }).select('_id').lean(),
    ]);
    entityIds = [...events.map((e) => e._id), ...offerings.map((o) => o._id)];
    if (!entityIds.length) {
      return {
        deals: [],
        stats: await getDealStatsSummary(),
        pagination: { page: 1, limit: 25, total: 0, pages: 0 },
      };
    }
    filter.entityId = { $in: entityIds };
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 25));
  const skip = (pageNum - 1) * limitNum;

  const [deals, total, stats] = await Promise.all([
    Deal.find(filter)
      .populate('musicianId', 'email')
      .populate('venueId', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Deal.countDocuments(filter),
    getDealStatsSummary(),
  ]);

  const eventIds = deals.filter((d) => d.entityType === 'EVENT').map((d) => d.entityId);
  const offeringIds = deals.filter((d) => d.entityType === 'OFFERING').map((d) => d.entityId);
  const [events, offerings, musicianProfiles, venueProfiles] = await Promise.all([
    eventIds.length ? Event.find({ _id: { $in: eventIds } }).select('title date status').lean() : [],
    offeringIds.length ? Offering.find({ _id: { $in: offeringIds } }).select('title date status').lean() : [],
    MusicianProfile.find({ userId: { $in: deals.map((d) => d.musicianId?._id || d.musicianId) } })
      .select('userId bandName')
      .lean(),
    VenueProfile.find({ userId: { $in: deals.map((d) => d.venueId?._id || d.venueId) } })
      .select('userId venueName')
      .lean(),
  ]);

  const entityMap = new Map();
  for (const e of events) entityMap.set(e._id.toString(), { ...e, entityType: 'EVENT' });
  for (const o of offerings) entityMap.set(o._id.toString(), { ...o, entityType: 'OFFERING' });
  const musicianNameMap = Object.fromEntries(musicianProfiles.map((p) => [p.userId.toString(), p.bandName]));
  const venueNameMap = Object.fromEntries(venueProfiles.map((p) => [p.userId.toString(), p.venueName]));

  const enriched = deals.map((d) => {
    const musicianId = (d.musicianId?._id || d.musicianId)?.toString();
    const venueId = (d.venueId?._id || d.venueId)?.toString();
    return {
      ...d,
      entity: entityMap.get(d.entityId.toString()) || null,
      musicianName: musicianNameMap[musicianId] || d.musicianId?.email || 'Musician',
      venueName: venueNameMap[venueId] || d.venueId?.email || 'Venue',
    };
  });

  return {
    deals: enriched,
    stats,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  };
}

async function getDealStatsSummary() {
  const [byStatus, revenueTotal, recentCount] = await Promise.all([
    Deal.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: { $ifNull: ['$agreedQuote', 0] } },
        },
      },
    ]),
    Deal.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$agreedQuote', 0] } } } },
    ]),
    Deal.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  return {
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id, { count: s.count, revenue: s.revenue }])),
    completedRevenue: revenueTotal[0]?.total ?? 0,
    last30Days: recentCount,
  };
}

export async function getNewsletterStats() {
  const [total, bySource, last30Days] = await Promise.all([
    NewsletterSubscriber.countDocuments(),
    NewsletterSubscriber.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]),
    NewsletterSubscriber.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  return {
    total,
    last30Days,
    bySource: Object.fromEntries(bySource.map((s) => [s._id || 'unknown', s.count])),
  };
}

export async function listNewsletterSubscribers({ q, page = 1, limit = 50 }) {
  const filter = {};
  const regex = buildTextFilter(q);
  if (regex) filter.email = regex;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(200, Math.max(1, Number(limit) || 50));
  const skip = (pageNum - 1) * limitNum;

  const [subscribers, total] = await Promise.all([
    NewsletterSubscriber.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    NewsletterSubscriber.countDocuments(filter),
  ]);

  return {
    subscribers,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  };
}

export async function getEventAdminById(eventId) {
  const event = await Event.findById(eventId).populate('venueId', 'email role').lean();
  if (!event) return null;

  const venueUserId = event.venueId?._id || event.venueId;
  const [venueProfile, applicationsCount, applications] = await Promise.all([
    VenueProfile.findOne({ userId: venueUserId }).lean(),
    Application.countDocuments({ entityId: event._id, entityType: 'EVENT' }),
    Application.find({ entityId: event._id, entityType: 'EVENT' })
      .populate('applicantId', 'email role')
      .sort({ createdAt: -1 })
      .limit(15)
      .lean(),
  ]);

  return { event, venueProfile, applicationsCount, applications };
}

export async function listEventsAdmin({ q, page = 1, limit = 25 }) {
  const filter = {};
  const regex = buildTextFilter(q);
  if (regex) filter.$or = [{ title: regex }, { description: regex }];

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 25));
  const skip = (pageNum - 1) * limitNum;

  const [events, total] = await Promise.all([
    Event.find(filter).populate('venueId', 'email').sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Event.countDocuments(filter),
  ]);

  return {
    events,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  };
}

export async function listApplicationsAdmin({ q, page = 1, limit = 25 }) {
  const filter = {};
  const regex = buildTextFilter(q);
  // Search by status or quote string match is limited; primary search via entity title
  if (regex) {
    const [events, offerings] = await Promise.all([
      Event.find({ title: regex }).select('_id').lean(),
      Offering.find({ title: regex }).select('_id').lean(),
    ]);
    const ids = [...events.map((e) => e._id), ...offerings.map((o) => o._id)];
    if (!ids.length) {
      return { applications: [], pagination: { page: 1, limit: 25, total: 0, pages: 0 } };
    }
    filter.entityId = { $in: ids };
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 25));
  const skip = (pageNum - 1) * limitNum;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate('applicantId', 'email role')
      .populate('ownerId', 'email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Application.countDocuments(filter),
  ]);

  const entityIds = { EVENT: [], OFFERING: [] };
  for (const a of applications) {
    entityIds[a.entityType].push(a.entityId);
  }
  const [events, offerings] = await Promise.all([
    entityIds.EVENT.length ? Event.find({ _id: { $in: entityIds.EVENT } }).select('title date status').lean() : [],
    entityIds.OFFERING.length
      ? Offering.find({ _id: { $in: entityIds.OFFERING } }).select('title date status').lean()
      : [],
  ]);
  const entityMap = new Map();
  for (const e of events) entityMap.set(e._id.toString(), e);
  for (const o of offerings) entityMap.set(o._id.toString(), o);

  const enriched = applications.map((a) => ({
    ...a,
    entity: entityMap.get(a.entityId.toString()) || null,
  }));

  return {
    applications: enriched,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  };
}
