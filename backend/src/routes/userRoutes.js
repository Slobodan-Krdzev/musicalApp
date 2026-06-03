import { Router } from 'express';
import { getProfile, getMyProfile, updateMyProfile, getMySubscription, getMyDashboardSummary, listMusicians, listVenues, deleteMyAccount } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { musicianProfileSchema, venueProfileSchema } from '../validators/profile.js';
import { deleteAccountSchema } from '../validators/account.js';
import { validate } from '../middleware/validate.js';
import { ValidationError } from '../utils/errors.js';

function validateProfileByRole() {
  return (req, res, next) => {
    const schema = req.user?.role === 'VENUE' ? venueProfileSchema : musicianProfileSchema;
    const result = schema.safeParse(req.body);
    if (result.success) {
      req.validated = result.data;
      next();
    } else {
      next(new ValidationError('Validation failed', result.error.flatten()));
    }
  };
}

const router = Router();

router.get('/musicians', listMusicians);
router.get('/venues', listVenues);
router.get('/profile/:id', getProfile);
router.get('/me/profile', authenticate, getMyProfile);
router.put('/me/profile', authenticate, validateProfileByRole(), updateMyProfile);
router.get('/me/subscription', authenticate, getMySubscription);
router.get('/me/summary', authenticate, getMyDashboardSummary);
router.delete('/me/account', authenticate, validate(deleteAccountSchema), deleteMyAccount);

export default router;
