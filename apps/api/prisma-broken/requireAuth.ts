import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to ensure a user is authenticated.
 * It checks for the presence of `req.user`, which should be populated by a preceding auth middleware.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required. No user session found.' });
  }
  next();
};