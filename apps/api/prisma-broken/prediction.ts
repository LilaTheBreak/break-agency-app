import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import {
  generatePrediction,
  getPredictionsForDeliverable,
  getPredictionsForUser,
} from '../controllers/predictionController';

const router = Router();

const canGenerateRoles = ['SUPER_ADMIN', 'ADMIN', 'EXCLUSIVE_TALENT', 'TALENT', 'FOUNDER', 'BRAND_PREMIUM'];
const canViewRoles = [...canGenerateRoles, 'BRAND_FREE', 'UGC_CREATOR'];

router.use(protect);

router.post('/generate', requireRole(canGenerateRoles), generatePrediction);
router.get('/deliverable/:deliverableId', requireRole(canViewRoles), getPredictionsForDeliverable);
router.get('/user/:userId', requireRole(canViewRoles), getPredictionsForUser);

export default router;