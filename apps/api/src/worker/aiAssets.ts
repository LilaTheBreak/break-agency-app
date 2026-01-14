import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { generateDeliverableAssets } from '../controllers/ai/assetController.js';

const router = Router();

// Protect all routes in this file
router.use(protect);

router.post('/generate', generateDeliverableAssets);
// router.post('/refine', refineDeliverableAssets);
// router.post('/variations', generateAssetVariations);

export default router;