import { Request, Response, NextFunction } from 'express';
import { SubscriptionStatus } from '../types/custom';
import { isSuperAdmin } from '../lib/roleHelpers';

/**
 * Middleware to require a specific subscription status.
 * CRITICAL: SUPERADMIN bypasses subscription checks
 * @param requiredStatuses An array of allowed subscription statuses.
 */
export const requireSubscription = (requiredStatuses: SubscriptionStatus[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // CRITICAL: Superadmin bypasses ALL subscription checks
    if (isSuperAdmin(req.user)) {
      return next();
    }

    if (!req.user?.subscription_status) {
      return res.status(403).json({ error: 'Subscription status could not be determined.' });
    }

    if (!requiredStatuses.includes(req.user.subscription_status)) {
      return res.status(403).json({ error: 'Your current subscription plan does not permit this action.' });
    }
    next();
  };
};