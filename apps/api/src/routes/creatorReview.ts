import { Router } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { requireRole } from '../../middleware/requireRole';
import {
  getPendingReviews,
  approveCreator,
  overrideCreatorRole,
} from '../../controllers/admin/creatorReviewController';

const router = Router();

// Protect all routes in this file with auth and admin role checks
router.use(protect, requireRole(['ADMIN', 'SUPER_ADMIN']));

router.route('/').get(getPendingReviews);
router.route('/:id/approve').post(approveCreator);
router.route('/:id/override').post(overrideCreatorRole);

export default router;