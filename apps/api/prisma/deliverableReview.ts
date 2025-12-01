import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import { isPremiumBrand } from '../middleware/isPremiumBrand';
import {
  submitForReview,
  getReview,
  approveDeliverable,
  requestChanges,
} from '../controllers/deliverableReviewController';

const router = Router();

// Creator uploads a deliverable for review
router.post('/:id/review', protect, requireRole(['EXCLUSIVE_TALENT', 'TALENT', 'UGC_CREATOR']), submitForReview);

// Anyone involved can view the review
router.get('/:id/review', protect, getReview);

// Admin and Brand Premium can approve or request changes
const actionRouter = Router();
actionRouter.use(protect); // Base protection

// This logic can be combined with a custom middleware checking ownership or role
actionRouter.post('/:id/approve', approveDeliverable);
actionRouter.post('/:id/request-changes', requestChanges);

router.use('/', actionRouter);

export default router;