import { Router } from 'express';
import prisma from '../../lib/prisma.js';

const router = Router();

/**
 * GET /api/ugc/listings
 * Fetches all approved and visible UGC creator listings.
 * Implements access control based on user role.
 */
router.get('/listings', async (req, res, next) => {
  try {
    // Mock user, in a real app this would come from auth middleware
    const user = { roles: [{ name: 'brand_premium' }] };

    const isPremium = user.roles.some(r => ['admin', 'super_admin', 'brand_premium'].includes(r.name));
    const isFree = user.roles.some(r => r.name === 'brand_free');

    let listings;
    if (isPremium) {
      listings = await prisma.uGCListing.findMany({
        where: { approved: true, visibility: true },
        include: { creator: { select: { name: true, avatarUrl: true } } },
      });
    } else if (isFree) {
      listings = await prisma.uGCListing.findMany({
        where: { approved: true, visibility: true },
        take: 10, // Free brands only see top 10
        include: { creator: { select: { name: true, avatarUrl: true } } },
      });
    } else {
      return res.status(403).json({ message: 'You do not have permission to view the UGC marketplace.' });
    }

    res.json(listings);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ugc/listings
 * Creates a listing for the authenticated UGC creator.
 */
router.post('/listings', async (req, res, next) => {
  // Logic to check if user is eligible (paid, portfolio exists) would go here.
  // const userId = req.user.id;
  // ...
  res.status(501).json({ message: 'Not implemented' });
});

export default router;