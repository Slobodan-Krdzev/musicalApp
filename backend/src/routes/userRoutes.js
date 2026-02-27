import { Router } from 'express';
import { getProfile, getMyProfile, updateMyProfile, getMySubscription, listMusicians } from '../controllers/userController.js';
import { authenticate, requireMusician, requireVenue } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { musicianProfileSchema, venueProfileSchema } from '../validators/profile.js';

const router = Router();

router.get('/musicians', listMusicians);
router.get('/profile/:id', getProfile);
router.get('/me/profile', authenticate, getMyProfile);
router.put('/me/profile', authenticate, validate(musicianProfileSchema.or(venueProfileSchema), (req) => req.body), updateMyProfile);
router.get('/me/subscription', authenticate, getMySubscription);

export default router;
