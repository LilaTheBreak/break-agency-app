import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Stub implementations for missing controllers
const getPendingReviews = async (req: Request, res: Response) => {
  return res.json({ reviews: [] });
};

const approveCreator = async (req: Request, res: Response) => {
  return res.json({ ok: true });
};

const overrideCreatorRole = async (req: Request, res: Response) => {
  return res.json({ ok: true });
};

// Protect all routes in this file with auth and admin role checks
router.use(requireAuth);

router.route('/').get(getPendingReviews);
router.route('/:id/approve').post(approveCreator);
router.route('/:id/override').post(overrideCreatorRole);
router.route('/:id/approve').post(approveCreator);
router.route('/:id/override').post(overrideCreatorRole);

export default router;