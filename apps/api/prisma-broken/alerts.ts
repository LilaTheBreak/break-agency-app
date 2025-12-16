import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import {
  getAlgorithmAlerts,
  getAlgorithmAlertById,
  deleteAlgorithmAlert,
} from '../controllers/alertsController';

const router = Router();

// Protect all alert routes
router.use(protect, requireRole(['ADMIN', 'SUPER_ADMIN', 'FOUNDER', 'EXCLUSIVE_TALENT', 'TALENT']));

router.get('/algorithm', getAlgorithmAlerts);
router.get('/algorithm/:alertId', getAlgorithmAlertById);
router.delete('/algorithm/:alertId', deleteAlgorithmAlert);

export default router;