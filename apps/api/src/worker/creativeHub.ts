import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import { searchHub, rankHubResults } from '../controllers/creativeHubController';

const router = Router();

const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'EXCLUSIVE_TALENT', 'TALENT', 'FOUNDER', 'BRAND_PREMIUM', 'BRAND_FREE', 'UGC_CREATOR'];

// Protect all routes, with specific logic handled in the service
router.use(protect, requireRole(allowedRoles));

router.get('/search', searchHub);
router.post('/rank', rankHubResults);

export default router;