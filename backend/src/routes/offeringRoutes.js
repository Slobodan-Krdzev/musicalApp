import { Router } from 'express';
import {
  listOfferings,
  getOffering,
  createOffering,
  updateOffering,
  getMyOfferings,
} from '../controllers/offeringController.js';
import { authenticate, requireMusician } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createOfferingSchema, updateOfferingSchema, offeringQuerySchema } from '../validators/offering.js';

const router = Router();

router.get('/', authenticate, validate(offeringQuerySchema, (req) => req.query), listOfferings);
router.get('/my', authenticate, getMyOfferings);
router.get('/:id', authenticate, getOffering);
router.post('/', authenticate, requireMusician, validate(createOfferingSchema), createOffering);
router.put('/:id', authenticate, requireMusician, validate(updateOfferingSchema), updateOffering);

export default router;
