import { Router } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { requireBrandRole } from '../../middleware/requireBrandRole';
import { isPremiumBrand } from '../../middleware/isPremiumBrand';
import {
  generateTimeline,
  getTimeline,
  updateTimelineItem,
  completeTimelineItem,
} from '../../controllers/campaign/timelineController';

const router = Router();

// Generation is a premium feature
router.post('/ai/campaign/timeline/generate/:bundleId', protect, isPremiumBrand, generateTimeline);

// All brand roles can view the timeline
router.get('/campaigns/:id/timeline', protect, requireBrandRole, getTimeline);

// Editing is a premium feature
router.patch('/campaigns/timeline/:timelineItemId', protect, isPremiumBrand, updateTimelineItem);
router.post('/campaigns/timeline/:timelineItemId/complete', protect, isPremiumBrand, completeTimelineItem);

export default router;