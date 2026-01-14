import { Router, Request, Response, NextFunction } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';

// Report functions stubbed
const getLatestWeeklyReport = async () => ({ data: [] });
const getReportHistory = async () => ({ data: [] });
const runReportGeneration = async () => ({ success: true });

const router = Router();

/**
 * Custom middleware to check access to reports.
 * Allows access if the user is an admin or viewing their own report.
 */
const checkReportAccess = (req: Request, res: Response, next: NextFunction) => {
  const requester = req.user!;
  const targetUserId = req.params.userId;

  if (requester.id === targetUserId) {
    return next();
  }

  const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'FOUNDER'];
  if (adminRoles.includes(requester.role!)) {
    return next();
  }

  return res.status(403).json({ error: 'You do not have permission to view these reports.' });
};

router.use('/:userId', protect, checkReportAccess);

router.get('/:userId/weekly', getLatestWeeklyReport);
router.get('/:userId/history', getReportHistory);

// Manual trigger is admin-only
router.post('/:userId/run', requireRole(['ADMIN', 'SUPER_ADMIN']), runReportGeneration);

export default router;