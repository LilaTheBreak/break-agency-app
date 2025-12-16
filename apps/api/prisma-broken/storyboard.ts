import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import { generateStoryboard, getStoryboard } from '../controllers/storyboardController';

const router = Router();

const canGenerateRoles = ['SUPER_ADMIN', 'ADMIN'];
const canViewRoles = [...canGenerateRoles, 'EXCLUSIVE_TALENT', 'TALENT', 'BRAND_PREMIUM', 'FOUNDER'];

router.use(protect);

router.post('/generate/:deliverableId', requireRole(canGenerateRoles), generateStoryboard);
router.post('/regenerate/:deliverableId', requireRole(canGenerateRoles), generateStoryboard); // Alias
router.get('/:deliverableId', requireRole(canViewRoles), getStoryboard);

export default router;