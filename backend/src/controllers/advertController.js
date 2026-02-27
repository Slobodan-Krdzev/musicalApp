import { Advert, Subscription } from '../models/index.js';
import { NotFoundError, SubscriptionRequiredError } from '../utils/errors.js';

async function requireSubscription(req) {
  const sub = await Subscription.findOne({ userId: req.user._id });
  const hasAccess = sub && (sub.status === 'active' || sub.status === 'trialing') &&
    (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) > new Date());
  if (!hasAccess) throw new SubscriptionRequiredError('Active subscription required');
}

/**
 * List adverts (public or filtered).
 */
export async function listAdverts(req, res, next) {
  try {
    const { musicianId, genre, area, page = 1, limit = 12 } = req.query;
    const filter = { status: 'ACTIVE' };
    if (musicianId) filter.musicianId = musicianId;
    if (genre) filter.genre = genre;
    if (area) filter.area = new RegExp(area, 'i');

    const skip = (Number(page) - 1) * Number(limit);
    const [adverts, total] = await Promise.all([
      Advert.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('musicianId', 'email'),
      Advert.countDocuments(filter),
    ]);
    res.json({
      success: true,
      adverts,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create advert (musician, subscription required).
 */
export async function createAdvert(req, res, next) {
  try {
    await requireSubscription(req);
    const advert = await Advert.create({ ...req.validated, musicianId: req.user._id });
    res.status(201).json({ success: true, advert });
  } catch (err) {
    next(err);
  }
}

/**
 * Update advert (owner).
 */
export async function updateAdvert(req, res, next) {
  try {
    const advert = await Advert.findOne({ _id: req.params.id, musicianId: req.user._id });
    if (!advert) throw new NotFoundError('Advert not found');
    Object.assign(advert, req.validated);
    await advert.save();
    res.json({ success: true, advert });
  } catch (err) {
    next(err);
  }
}

/**
 * My adverts.
 */
export async function getMyAdverts(req, res, next) {
  try {
    const adverts = await Advert.find({ musicianId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, adverts });
  } catch (err) {
    next(err);
  }
}
