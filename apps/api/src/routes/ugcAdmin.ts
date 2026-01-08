import { Router } from 'express';
// @ts-ignore - Module resolution issue
import { protect } from '../middleware/authMiddleware.js';
// @ts-ignore - Module resolution issue
import { requireRole } from '../middleware/requireRole.js';
// @ts-ignore - Module resolution issue
import {
  approveListing,
  approveBrandRequest,
  // @ts-ignore - Module resolution issue
} from '../controllers/admin/ugcAdminController.js';

const router = Router();
router.use(protect, requireRole(['ADMIN', 'SUPER_ADMIN']));

router.post('/listings/:id/approve', approveListing);
router.post('/requests/:id/approve', approveBrandRequest);

export default router;