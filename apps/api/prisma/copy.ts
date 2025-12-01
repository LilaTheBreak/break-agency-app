import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import {
  generateCopyForDeliverable,
  getGeneratedCopy,
  updateCopy,
  regenerateCopy,
} from '../controllers/copywritingController';

const router = Router();

// Protect all routes
router.use(protect);

router.post('/generate/:deliverableId', requireRole(['ADMIN', 'SUPER_ADMIN', 'EXCLUSIVE_TALENT', 'UGC_CREATOR']), generateCopyForDeliverable);
router.get('/:deliverableId', getGeneratedCopy);
router.post('/:copyId/update', requireRole(['ADMIN', 'SUPER_ADMIN', 'EXCLUSIVE_TALENT']), updateCopy);
router.post('/:copyId/regenerate', requireRole(['ADMIN', 'SUPER_ADMIN', 'EXCLUSIVE_TALENT']), regenerateCopy);

export default router;