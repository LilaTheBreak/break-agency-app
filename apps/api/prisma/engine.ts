import { Router } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { requireRole } from '../../middleware/requireRole';
import {
  analyseOffer,
  getStrategyPaths,
  runAutoAgent,
} from '../../controllers/negotiation/engineController';

const router = Router();

// Protect all routes, accessible by talent/founders
router.use(protect, requireRole(['EXCLUSIVE_TALENT', 'TALENT', 'FOUNDER']));

router.post('/analyse', analyseOffer);
router.post('/strategy-paths', getStrategyPaths);
router.post('/auto-agent/run', runAutoAgent);

export default router;