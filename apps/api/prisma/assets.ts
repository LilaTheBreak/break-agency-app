import { Router } from 'express';
import { generateCreativeAsset } from '../services/ai/assetGenerator.js';

const router = Router();

/**
 * POST /api/assets/generate
 * Triggers the AI creative asset generation pipeline.
 */
router.post('/generate', async (req, res, next) => {
  try {
    // In a real app, the user object would come from authentication middleware (e.g., req.user)
    const mockUser = { id: 'clxrz45gn000008l4hy285p0g', roles: [{ role: { name: 'admin' } }] };
    const { deliverableId, type, preferences } = req.body;

    const asset = await generateCreativeAsset({ user: mockUser, deliverableId, type, preferences });
    res.status(201).json(asset);
  } catch (error) {
    next(error);
  }
});

export default router;