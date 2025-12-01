import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to ensure the user has a brand role.
 */
export const requireBrandRole = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (req.user.role !== 'BRAND_FREE' && req.user.role !== 'BRAND_PREMIUM') {
    return res.status(403).json({ error: 'Access denied. Brand role required.' });
  }

  next();
};