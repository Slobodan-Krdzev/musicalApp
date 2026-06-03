import { listPublicParties } from '../services/partyService.js';

export async function listParties(req, res, next) {
  try {
    const result = await listPublicParties(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}
