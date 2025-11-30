import { Request, Response, NextFunction } from 'express';
import { SubscriptionStatus } from '@prisma/client';

/**
 * Middleware to require a specific subscription status.
 * @param requiredStatuses An array of allowed subscription statuses.
 */
export const requireSubscription = (requiredStatuses: SubscriptionStatus[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.subscription_status) {
      return res.status(403).json({ error: 'Subscription status could not be determined.' });
    }

    if (!requiredStatuses.includes(req.user.subscription_status)) {
      return res.status(403).json({ error: 'Your current subscription plan does not permit this action.' });
    }
    next();
  };
};