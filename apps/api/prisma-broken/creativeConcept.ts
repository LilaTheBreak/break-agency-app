import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import { generateCreative, getCreative } from '../controllers/creativeConceptController';

const router = Router();

const canGenerateRoles = ['SUPER_ADMIN', 'ADMIN', 'EXCLUSIVE_TALENT', 'TALENT'];
const canViewRoles = [...canGenerateRoles, 'BRAND_PREMIUM', 'FOUNDER'];

router.use(protect);

router.post('/generate/:deliverableId', requireRole(canGenerateRoles), generateCreative);
router.post('/regenerate/:deliverableId', requireRole(canGenerateRoles), generateCreative); // Alias for generate
router.get('/output/:deliverableId', requireRole(canViewRoles), getCreative);

export default router;