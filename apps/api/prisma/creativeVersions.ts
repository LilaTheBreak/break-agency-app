import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import {
  createAssetVersion,
  getVersionHistory,
  getSpecificVersion,
  rollbackVersion,
} from '../controllers/creativeVersionController';

const router = Router();

const canWriteRoles = ['SUPER_ADMIN', 'ADMIN', 'EXCLUSIVE_TALENT', 'TALENT', 'FOUNDER'];
const canReadRoles = [...canWriteRoles, 'BRAND_PREMIUM', 'BRAND_FREE', 'UGC_CREATOR'];

router.use(protect);

router.get('/history/:assetId', requireRole(canReadRoles), getVersionHistory);
router.get('/version/:assetId/:version', requireRole(canReadRoles), getSpecificVersion);
router.post('/create', requireRole(canWriteRoles), createAssetVersion);
router.post('/rollback', requireRole(canWriteRoles), rollbackVersion);

export default router;