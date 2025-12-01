import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import {
  createReviewRequest,
  getAssetReviews,
  approveCreative,
  requestCreativeChanges,
  addReviewComment,
  resolveReviewComment,
} from '../controllers/creativeReviewController';

const router = Router();

const canCommentRoles = ['SUPER_ADMIN', 'ADMIN', 'EXCLUSIVE_TALENT', 'TALENT', 'FOUNDER', 'BRAND_PREMIUM', 'UGC_CREATOR'];
const canApproveRoles = ['SUPER_ADMIN', 'ADMIN', 'EXCLUSIVE_TALENT', 'TALENT', 'FOUNDER', 'BRAND_PREMIUM'];

// Protect all routes
router.use(protect);

router.post('/request', createReviewRequest);
router.get('/:assetId', getAssetReviews);

router.post('/:reviewId/comment', requireRole(canCommentRoles), addReviewComment);
router.post('/comment/:commentId/resolve', requireRole(canApproveRoles), resolveReviewComment);
router.post('/:reviewId/approve', requireRole(canApproveRoles), approveCreative);
router.post('/:reviewId/request-changes', requireRole(canApproveRoles), requestCreativeChanges);

export default router;