import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import {
  generateSlot,
  getSlots,
  scheduleSlot,
  approveSlot,
  markAsPosted,
} from '../controllers/calendarController';

const router = Router();

// All calendar routes require authentication
router.use(protect);

// Public GET endpoint, filtering happens in controller
router.get('/slots', getSlots);

// Admin/Talent-only actions
router.post('/auto-schedule/:deliverableId', requireRole(['ADMIN', 'SUPER_ADMIN', 'EXCLUSIVE_TALENT']), generateSlot);
router.post('/slots/:slotId/schedule', requireRole(['ADMIN', 'SUPER_ADMIN', 'EXCLUSIVE_TALENT']), scheduleSlot);
router.post('/slots/:slotId/mark-posted', requireRole(['ADMIN', 'SUPER_ADMIN', 'EXCLUSIVE_TALENT']), markAsPosted);

// Admin-only approval
router.post('/slots/:slotId/approve', requireRole(['ADMIN', 'SUPER_ADMIN']), approveSlot);

export default router;