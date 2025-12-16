import { Router } from 'express';
import {
  createCampaign,
  getBrandCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
} from '../../controllers/brand/campaignsController';
import { protect } from '../../middleware/authMiddleware';
import { requireFeature } from '../../middleware/requireFeature';
import { requireSubscription } from '../../middleware/requireSubscription';
import { checkOnboardingApproved } from '../../middleware/checkOnboardingApproved';

const router = Router();

router.use(protect, checkOnboardingApproved, requireFeature('brand_portal'), requireSubscription(['PREMIUM']));

router.route('/').post(createCampaign).get(getBrandCampaigns);

router.route('/:id').get(getCampaignById).put(updateCampaign).delete(deleteCampaign);

export default router;