import { Router } from 'express';
import { listAdverts, createAdvert, updateAdvert, getMyAdverts } from '../controllers/advertController.js';
import { authenticate, requireMusician } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createAdvertSchema, updateAdvertSchema } from '../validators/advert.js';

const router = Router();

router.get('/', listAdverts);
router.get('/my', authenticate, requireMusician, getMyAdverts);
router.post('/', authenticate, requireMusician, validate(createAdvertSchema), createAdvert);
router.put('/:id', authenticate, requireMusician, validate(updateAdvertSchema), updateAdvert);

export default router;
