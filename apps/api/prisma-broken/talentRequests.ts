import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import { requireBrandRole } from '../middleware/requireBrandRole';
import {
  createTalentRequest,
  listMySentRequests,
  listAllTalentRequests,
  approveTalentRequest,
  listMyIncomingRequests,
  respondToTalentRequest,
} from '../controllers/talentRequestController';

const router = Router();

// --- Brand Routes ---
router.post('/brand/talent-requests', protect, requireBrandRole, createTalentRequest);
router.get('/brand/talent-requests', protect, requireBrandRole, listMySentRequests);

// --- Admin Routes ---
const adminRouter = Router();
adminRouter.use(protect, requireRole(['ADMIN', 'SUPER_ADMIN']));
adminRouter.get('/talent-requests', listAllTalentRequests);
adminRouter.post('/talent-requests/:id/approve', approveTalentRequest);
// Add a decline route as well
router.use('/admin', adminRouter);

// --- Creator Routes ---
const creatorRouter = Router();
creatorRouter.use(protect, requireRole(['EXCLUSIVE_TALENT', 'TALENT', 'UGC_CREATOR']));
creatorRouter.get('/requests', listMyIncomingRequests);
creatorRouter.post('/requests/:id/respond', respondToTalentRequest);
router.use('/creator', creatorRouter);

export default router;