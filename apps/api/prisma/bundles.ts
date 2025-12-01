import { Router } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { requireRole } from '../../middleware/requireRole';
import { requireBrandRole } from '../../middleware/requireBrandRole';
import {
  generateBundles,
  getBriefBundles,
  convertBundleToPlan,
} from '../../controllers/ai/bundleController';

const router = Router();

// Admin route to trigger generation
router.post('/generate/:briefId', protect, requireRole(['ADMIN', 'SUPER_ADMIN']), generateBundles);

// Brand-facing route to get results
router.get('/brand/briefs/:id/bundles', protect, requireBrandRole, getBriefBundles);

router.post('/:id/convert-to-plan', protect, requireBrandRole, convertBundleToPlan);

export default router;