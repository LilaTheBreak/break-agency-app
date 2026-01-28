import { Router } from 'express';
// @ts-ignore - Module resolution issue
import { protect } from '../middleware/authMiddleware.js';
// @ts-ignore - Module resolution issue
import { requireRole } from '../middleware/requireRole.js';
// @ts-ignore - Module resolution issue
import {
  submitUgcApplication,
  getMyApplication,
  listUgcApplications,
  approveUgcApplication,
  rejectUgcApplication,
} from '../controllers/ugc/applicationController.js';
// @ts-ignore - Module resolution issue
import { createOrUpdateProfile, getMyProfile } from '../controllers/ugc/profileController.js';

const router = Router();

// UGC Creator profile routes
router.post('/profile', protect, requireRole(['UGC']), createOrUpdateProfile);
router.get('/profile', protect, requireRole(['UGC']), getMyProfile);

// Creator-facing routes
router.post('/apply', protect, requireRole(['UGC_CREATOR']), submitUgcApplication);
router.get('/application/my', protect, requireRole(['UGC_CREATOR']), getMyApplication);

// Admin-facing routes
const adminRouter = Router();
adminRouter.use(protect, requireRole(['ADMIN', 'SUPER_ADMIN']));

adminRouter.get('/ugc-applications', listUgcApplications);
adminRouter.post('/ugc-applications/:id/approve', approveUgcApplication);
adminRouter.post('/ugc-applications/:id/reject', rejectUgcApplication);

router.use('/admin', adminRouter);

export default router;