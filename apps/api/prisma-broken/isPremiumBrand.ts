import { Request, Response, NextFunction } from 'express';

export const isPremiumBrand = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (req.user.subscriptionStatus !== 'premium') {
    return res.status(402).json({ error: 'This feature requires a Premium subscription.' });
  }

  next();
};