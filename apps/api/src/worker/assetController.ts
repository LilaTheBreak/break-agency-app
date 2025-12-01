import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { assetGenerationQueue } from '../../worker/queues';

const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'EXCLUSIVE_TALENT', 'TALENT', 'FOUNDER', 'BRAND_PREMIUM'];

const checkPermissions = (req: Request) => {
  if (!allowedRoles.includes(req.user!.role)) {
    // Add logic for UGC creators with active subscriptions
    throw new Error('You do not have permission to generate assets.');
  }
};

// @desc    Queue a job to generate creative assets for a deliverable
// @route   POST /api/ai/assets/generate
export const generateDeliverableAssets = asyncHandler(async (req: Request, res: Response) => {
  checkPermissions(req);
  const { deliverableId } = req.body;
  const userId = req.user!.id;

  if (!deliverableId) {
    res.status(400);
    throw new Error('Deliverable ID is required.');
  }

  await assetGenerationQueue.add('generate-assets', { deliverableId, userId });

  res.status(202).json({ message: 'Asset generation has been queued.' });
});

// Other endpoints for refine and variations would go here
// export const refineDeliverableAssets = asyncHandler(...)
// export const generateAssetVariations = asyncHandler(...)