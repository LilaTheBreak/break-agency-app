import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { protect } from '../middleware/authMiddleware';
import { getRosterForUser } from '../services/rosterService';

const router = Router();

router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const roster = await getRosterForUser(req.user!);
    res.status(200).json(roster);
  })
);

export default router;