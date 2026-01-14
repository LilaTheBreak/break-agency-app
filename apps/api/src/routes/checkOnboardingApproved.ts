import { Request, Response, NextFunction } from 'express';
import { isAdmin as checkIsAdmin } from '../lib/roleHelpers';

/**
 * Middleware to check if a user's onboarding has been approved.
 * This should be placed after the `protect` middleware.
 */
export const checkOnboardingApproved = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    // This should technically be caught by `protect` middleware first
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Admins and Super Admins can bypass this check
  if (checkIsAdmin(req.user)) {
    return next();
  }

  if (req.user.onboarding_status !== 'approved') {
    return res.status(403).json({ error: 'Access denied. Your account is pending review.' });
  }

  next();
};