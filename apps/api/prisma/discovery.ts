import { Router } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { requireFeature } from '../../middleware/requireFeature';
import {
  getDiscoveryHomepage,
  filterCreators,
  getCreatorProfile,
} from '../../controllers/brand/discoveryController';

const router = Router();

// All discovery routes require a user to be a brand and have portal access
router.use(protect, requireFeature('brand_portal'));

router.get('/', getDiscoveryHomepage);
router.post('/filter', filterCreators);
router.get('/profile/:creatorId', getCreatorProfile);

export default router;