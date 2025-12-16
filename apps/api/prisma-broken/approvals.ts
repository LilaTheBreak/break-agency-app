import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import {
  createApprovalRequest,
  getApprovalHistory,
  approveRequest,
  requestEdits,
  addComment,
} from '../controllers/approvalController';

const router = Router();

// All routes require authentication
router.use(protect);

router.post('/create', createApprovalRequest); // Permissions checked in service/controller
router.get('/:entityType/:entityId', getApprovalHistory);
router.post('/:id/comment', addComment);

router.post('/:id/approve', requireRole(['ADMIN', 'SUPER_ADMIN', 'BRAND_PREMIUM']), approveRequest);
router.post('/:id/request-edits', requireRole(['ADMIN', 'SUPER_ADMIN', 'BRAND_PREMIUM']), requestEdits);

export default router;