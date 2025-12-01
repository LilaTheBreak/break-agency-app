import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { protect } from '../middleware/authMiddleware';

const prisma = new PrismaClient();
const router = Router();

const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'FOUNDER', 'BRAND_FREE', 'BRAND_PREMIUM'];

/**
 * Middleware to check if the user's role is allowed to see the VIP roster.
 */
const checkVipAccess = (req, res, next) => {
  if (req.user && allowedRoles.includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ error: 'You do not have permission to view this roster.' });
};

router.get(
  '/vip',
  protect,
  checkVipAccess,
  asyncHandler(async (req, res) => {
    const vips = await prisma.friendsOfHouse.findMany({ orderBy: { name: 'asc' } });
    res.status(200).json(vips);
  })
);

export default router;