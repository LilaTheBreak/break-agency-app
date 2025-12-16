import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireBrandRole } from '../middleware/requireBrandRole';
import {
  createBrandCampaign,
  listMyCampaigns,
  getMyCampaignById,
} from '../controllers/brand/brandCampaignsController';
import {
  listAllCampaigns,
  getAnyCampaignById,
  reviewCampaign,
} from '../controllers/brand/brandCampaignsController';
import { requireRole } from '../middleware/requireRole';

const router = Router();

// Brand-facing routes
router.post('/', protect, requireBrandRole, createBrandCampaign);
router.get('/', protect, requireBrandRole, listMyCampaigns);
router.get('/:id', protect, requireBrandRole, getMyCampaignById);

// Admin-facing routes
const adminRouter = Router();
adminRouter.use(protect, requireRole(['ADMIN', 'SUPER_ADMIN']));
adminRouter.get('/', listAllCampaigns);
adminRouter.get('/:id', getAnyCampaignById);
adminRouter.post('/:id/review', reviewCampaign);

router.use('/admin/brand-campaigns', adminRouter);

export default router;