import { Offering, MusicianProfile, User, Subscription } from '../models/index.js';
import { NotFoundError, SubscriptionRequiredError } from '../utils/errors.js';
import { matchAndNotifyVenues } from '../services/eventMatchingService.js';
import { createNotification } from '../services/notificationService.js';
import { emailService } from '../services/emailService.js';

async function expireStaleOfferings() {
  await Offering.updateMany(
    { status: 'ACTIVE', activeTo: { $lt: new Date() } },
    { $set: { status: 'EXPIRED' } }
  );
}

/**
 * List offerings (venue-only view).
 */
export async function listOfferings(req, res, next) {
  try {
    await expireStaleOfferings();

    if (req.user?.role !== 'VENUE') {
      return res.json({ success: true, offerings: [], pagination: { page: 1, limit: 12, total: 0, pages: 0 } });
    }

    const { genre, lookingFor, dateFrom, dateTo, musicianId, page = 1, limit = 12 } = req.validated ?? {};
    const filter = { status: 'ACTIVE' };

    if (genre) filter.genres = { $in: [genre] };
    if (lookingFor) filter.lookingFor = { $in: [lookingFor] };
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = dateFrom;
      if (dateTo) filter.date.$lte = dateTo;
    }
    if (musicianId) filter.musicianId = musicianId;

    const skip = (page - 1) * limit;
    const [offerings, total] = await Promise.all([
      Offering.find(filter).sort({ date: 1 }).skip(skip).limit(limit).lean(),
      Offering.countDocuments(filter),
    ]);

    const musicianIds = [...new Set(offerings.map((o) => o.musicianId.toString()))];
    const musicianProfiles = await MusicianProfile.find({ userId: { $in: musicianIds } }).lean();
    const profileMap = Object.fromEntries(musicianProfiles.map((p) => [p.userId.toString(), p]));

    const enriched = offerings.map((o) => ({
      ...o,
      musicianProfile: profileMap[o.musicianId.toString()] || null,
    }));

    res.json({
      success: true,
      offerings: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get single offering by ID.
 */
export async function getOffering(req, res, next) {
  try {
    await expireStaleOfferings();
    const offering = await Offering.findById(req.params.id).lean();
    if (!offering) throw new NotFoundError('Offering not found');
    const musicianProfile = await MusicianProfile.findOne({ userId: offering.musicianId }).lean();
    res.json({ success: true, offering, musicianProfile: musicianProfile || null });
  } catch (err) {
    next(err);
  }
}

/**
 * Create offering (musician only, requires active subscription).
 */
export async function createOffering(req, res, next) {
  try {
    const sub = await Subscription.findOne({ userId: req.user._id });
    const hasAccess = sub && (sub.status === 'active' || sub.status === 'trialing') &&
      (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) > new Date());
    if (!hasAccess) throw new SubscriptionRequiredError('Active subscription required to create offerings');

    const musicianProfile = await MusicianProfile.findOne({ userId: req.user._id }).lean();

    const offering = await Offering.create({
      ...req.validated,
      musicianId: req.user._id,
      status: 'ACTIVE',
      genres: musicianProfile?.genres || [],
      interests: musicianProfile?.interests || [],
    });

    // Confirmation email to the musician
    emailService.send(
      req.user.email,
      `Offering created: ${offering.title}`,
      `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
          <h2 style="color:#7c3aed;">Offering Created Successfully!</h2>
          <p>Your offering "<strong>${offering.title}</strong>" is now live.</p>
          <p><strong>Date:</strong> ${new Date(offering.date).toLocaleDateString()}</p>
          <p><strong>Active until:</strong> ${new Date(offering.activeTo).toLocaleDateString()}</p>
          ${offering.description ? `<p>${offering.description.slice(0, 300)}</p>` : ''}
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">Go to Dashboard</a>
        </div>
      `,
      `Your offering "${offering.title}" is now live.`
    ).catch(() => {});

    // Notify matching venues
    matchAndNotifyVenues(offering, musicianProfile).catch(() => {});

    res.status(201).json({ success: true, offering });
  } catch (err) {
    next(err);
  }
}

/**
 * Update offering (owner only).
 */
export async function updateOffering(req, res, next) {
  try {
    const offering = await Offering.findOne({ _id: req.params.id, musicianId: req.user._id });
    if (!offering) throw new NotFoundError('Offering not found');
    Object.assign(offering, req.validated);
    await offering.save();
    res.json({ success: true, offering });
  } catch (err) {
    next(err);
  }
}

/**
 * List my offerings (musician).
 */
export async function getMyOfferings(req, res, next) {
  try {
    if (req.user.role !== 'MUSICIAN') {
      return res.json({ success: true, offerings: [] });
    }
    await expireStaleOfferings();
    const offerings = await Offering.find({ musicianId: req.user._id }).sort({ date: -1 });
    res.json({ success: true, offerings });
  } catch (err) {
    next(err);
  }
}
