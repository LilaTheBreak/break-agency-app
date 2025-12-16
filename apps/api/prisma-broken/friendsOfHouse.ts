import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import {
  listVips,
  createVip,
  updateVip,
  deleteVip,
} from '../controllers/admin/friendsOfHouseController';

const router = Router();

// Public route to list VIPs
router.get('/vip', listVips);

// Admin-only routes for CRUD operations
const adminRouter = Router();
adminRouter.use(protect, requireRole(['ADMIN', 'SUPER_ADMIN']));
adminRouter.route('/').post(createVip);
adminRouter.route('/:id').put(updateVip).delete(deleteVip);

router.use('/admin/vip', adminRouter);

export default router;