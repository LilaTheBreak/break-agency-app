import { Router } from 'express';
import { protect } from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/requireRole.js';
import {
  approveListing,
  approveBrandRequest,
} from '../../controllers/admin/ugcAdminController.js';

const router = Router();
router.use(protect, requireRole(['ADMIN', 'SUPER_ADMIN']));

router.post('/listings/:id/approve', approveListing);
router.post('/requests/:id/approve', approveBrandRequest);

export default router;