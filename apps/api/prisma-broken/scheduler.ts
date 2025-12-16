import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import {
  schedulePost,
  updatePost,
  cancelPost,
  getUserSchedule,
  getRecommendation,
} from '../controllers/schedulerController';

const router = Router();

const canScheduleRoles = ['SUPER_ADMIN', 'ADMIN', 'EXCLUSIVE_TALENT'];
const canViewRoles = [...canScheduleRoles, 'TALENT', 'UGC_CREATOR', 'BRAND_PREMIUM', 'BRAND_FREE'];

router.use(protect);

router.get('/user/:userId', requireRole(canViewRoles), getUserSchedule);
router.get('/recommendation/:userId', requireRole(canScheduleRoles), getRecommendation);

router.post('/', requireRole(canScheduleRoles), schedulePost);
router.put('/:id', requireRole(canScheduleRoles), updatePost);
router.delete('/:id', requireRole(canScheduleRoles), cancelPost);

export default router;