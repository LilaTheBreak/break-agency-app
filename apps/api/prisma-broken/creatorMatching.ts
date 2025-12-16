import { Router } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { requireRole } from '../../middleware/requireRole';
import { requireBrandRole } from '../../middleware/requireBrandRole';
import {
  runMatchingEngine,
  getBriefMatches,
  getMatchesForCreator,
} from '../../controllers/ai/creatorMatchingController';

const router = Router();

// Internal/Admin route to trigger the engine
router.post('/generate', protect, requireRole(['ADMIN', 'SUPER_ADMIN']), runMatchingEngine);

// Brand-facing route to get results
router.get('/brand/briefs/:id/matches', protect, requireBrandRole, getBriefMatches);

// Admin route to see a creator's match history
router.get('/:creatorId', protect, requireRole(['ADMIN', 'SUPER_ADMIN']), getMatchesForCreator);

// The admin route for /admin/briefs/:id/matches can reuse getBriefMatches without the subscription filter.

export default router;