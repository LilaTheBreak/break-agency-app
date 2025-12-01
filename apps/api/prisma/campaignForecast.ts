import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import {
  triggerForecastGeneration,
  getForecastForBrief,
  getForecastsForBrand,
} from '../controllers/campaignForecastController';

const router = Router();

const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'FOUNDER', 'BRAND_PREMIUM'];

// Protect all routes and ensure user has a premium role
router.use(protect, requireRole(allowedRoles));

router.post('/:briefId', triggerForecastGeneration);
router.get('/brief/:briefId', getForecastForBrief);
router.get('/brand/:brandId', getForecastsForBrand);

export default router;