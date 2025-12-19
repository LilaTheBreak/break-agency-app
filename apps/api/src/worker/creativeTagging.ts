import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  tagSingleAsset,
  retagSingleAsset,
  tagBatchAssets,
} from '../controllers/creativeTaggingController.js';

const router = Router();

router.use(protect);

router.post('/tag', tagSingleAsset);
router.post('/retag', retagSingleAsset);
router.post('/batch', requireRole(['ADMIN', 'SUPER_ADMIN']), tagBatchAssets);

export default router;