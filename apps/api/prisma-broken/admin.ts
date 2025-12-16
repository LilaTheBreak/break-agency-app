import { Router } from 'express';
import prisma from '../../lib/prisma.js';

const router = Router();

// All routes here should be protected by an admin role guard.

/**
 * GET /api/ugc/admin/pending
 * Fetches all UGC listings awaiting admin approval.
 */
router.get('/admin/pending', async (req, res, next) => {
  try {
    const pending = await prisma.uGCListing.findMany({
      where: { approved: false },
      include: { creator: { select: { name: true, email: true } } },
    });
    res.json(pending);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/ugc/admin/approve/:id
 * Approves a UGC listing.
 */
router.put('/admin/approve/:id', async (req, res, next) => {
  try {
    const listing = await prisma.uGCListing.update({ where: { id: req.params.id }, data: { approved: true } });
    res.json(listing);
  } catch (error) {
    next(error);
  }
});

export default router;