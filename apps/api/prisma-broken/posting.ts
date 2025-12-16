import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import {
  generateSchedule,
  getSchedule,
  cancelSchedule,
  publishNow,
} from '../controllers/postingController';

const router = Router();

const canWriteRoles = ['SUPER_ADMIN', 'ADMIN', 'EXCLUSIVE_TALENT'];
const canViewRoles = [...canWriteRoles, 'TALENT', 'BRAND_PREMIUM', 'FOUNDER', 'UGC_CREATOR'];

router.use(protect);

router.post('/generate/:deliverableId', requireRole(canWriteRoles), generateSchedule);
router.post('/publish-now/:scheduleId', requireRole(canWriteRoles), publishNow);
router.post('/cancel/:scheduleId', requireRole(canWriteRoles), cancelSchedule);
router.get('/:deliverableId', requireRole(canViewRoles), getSchedule);

export default router;