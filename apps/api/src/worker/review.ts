import { Router } from 'express';
import { protect } from '../../middleware/authMiddleware.js';
import { requireFeature } from '../../middleware/requireFeature.js';
import {
  uploadContractForReview,
  getContractReview,
  regenerateReview,
} from '../../controllers/contracts/reviewController.js';

const router = Router();

// Protect all routes, requires the 'contract_review' feature
router.use(protect, requireFeature('contract_review'));

router.post('/upload', uploadContractForReview); // Needs multer middleware for file uploads
router.get('/:id', getContractReview);
router.post('/:id/regenerate', regenerateReview);

export default router;