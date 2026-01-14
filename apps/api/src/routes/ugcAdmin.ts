import { Router } from 'express';
// @ts-ignore - Module resolution issue
import { protect } from '../middleware/authMiddleware';
// @ts-ignore - Module resolution issue
import { requireRole } from '../middleware/requireRole';
// @ts-ignore - Module resolution issue
import {
  approveListing,
  approveBrandRequest,
  // @ts-ignore - Module resolution issue
} from '../controllers/admin/ugcAdminController';

const router = Router();
router.use(protect, requireRole(['ADMIN', 'SUPER_ADMIN']));

router.post('/listings/:id/approve', approveListing);
router.post('/requests/:id/approve', approveBrandRequest);

export default router;