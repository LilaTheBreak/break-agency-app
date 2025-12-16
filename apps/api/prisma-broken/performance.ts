import { Router, Request, Response, NextFunction } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  fetchPerformanceOverview,
  fetchRateBenchmarks,
  fetchCategoryBenchmarks,
  fetchGrowthForecast,
  fetchContentInsights,
} from '../controllers/performanceController';

const router = Router();

/**
 * Custom middleware for performance routes to enforce access control.
 * Allows access if:
 * - The requester is an Admin or Founder.
 * - The requester is viewing their own profile.
 * - The requester is a Premium Brand (read-only access).
 */
const checkPerformanceAccess = (req: Request, res: Response, next: NextFunction) => {
  const requester = req.user!;
  const targetUserId = req.params.userId;

  // Users can always see their own performance data
  if (requester.id === targetUserId) {
    return next();
  }

  // Admins and Founders have universal access
  const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'FOUNDER'];
  if (adminRoles.includes(requester.role!)) {
    return next();
  }

  // Brand Premium users can view roster profiles
  if (requester.role === 'BRAND_PREMIUM') {
    return next();
  }

  res.status(403).json({ error: 'You do not have permission to view this performance data.' });
};

router.use('/:userId', protect, checkPerformanceAccess);

router.get('/:userId/overview', fetchPerformanceOverview);
router.get('/:userId/rates', fetchRateBenchmarks);
router.get('/:userId/category', fetchCategoryBenchmarks);
router.get('/:userId/forecast', fetchGrowthForecast);
router.get('/:userId/content-insights', fetchContentInsights);

export default router;