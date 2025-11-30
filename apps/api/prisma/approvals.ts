import { Router } from 'express';
import {
  approveAsManager,
  rejectAsManager,
  approveAsBrand,
  rejectAsBrand,
} from '../services/approval/approvalService.js';
import prisma from '../lib/prisma.js';

const router = Router();

/**
 * POST /api/approvals/:id/manager/approve
 */
router.post('/:id/manager/approve', async (req, res, next) => {
  try {
    // In a real app, managerId would come from req.user
    await approveAsManager(req.params.id, 'manager_user_id');
    res.json({ message: 'Approved and sent to brand.' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/approvals/:id/manager/reject
 */
router.post('/:id/manager/reject', async (req, res, next) => {
  try {
    await rejectAsManager(req.params.id, 'manager_user_id', req.body.comments);
    res.json({ message: 'Rejected and sent back for revision.' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/approvals/:id/history
 */
router.get('/:id/history', async (req, res) => {
  const history = await prisma.approvalLog.findMany({ where: { deliverableId: req.params.id }, orderBy: { createdAt: 'asc' } });
  res.json(history);
});

export default router;