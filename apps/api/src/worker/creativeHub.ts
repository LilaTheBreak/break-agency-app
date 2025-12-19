import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/requireRole.js';
import { searchHub, rankHubResults } from '../controllers/creativeHubController.js';

const router = Router();

const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'EXCLUSIVE_TALENT', 'TALENT', 'FOUNDER', 'BRAND_PREMIUM', 'BRAND_FREE', 'UGC_CREATOR'];

// Protect all routes, with specific logic handled in the service
router.use(protect, requireRole(allowedRoles));

router.get('/search', searchHub);
router.post('/rank', rankHubResults);

export default router;