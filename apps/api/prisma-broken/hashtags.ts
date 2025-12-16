import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import {
  generateHashtags,
  getHashtags,
  selectFinalHashtags,
} from '../controllers/hashtagController';

const router = Router();

const canGenerateRoles = ['SUPER_ADMIN', 'ADMIN', 'EXCLUSIVE_TALENT', 'TALENT'];
const canViewRoles = [...canGenerateRoles, 'BRAND_PREMIUM', 'FOUNDER', 'UGC_CREATOR'];

router.use(protect);

router.post('/generate/:deliverableId', requireRole(canGenerateRoles), generateHashtags);
router.post('/regenerate/:deliverableId', requireRole(canGenerateRoles), generateHashtags); // Alias
router.get('/:deliverableId', requireRole(canViewRoles), getHashtags);
router.post('/select/:hashtagSetId', requireRole(canGenerateRoles), selectFinalHashtags);

export default router;