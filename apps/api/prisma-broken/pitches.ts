import { Router } from 'express';
import { generateBrandPitch } from '../services/ai/pitchGenerator.js';

const router = Router();

/**
 * POST /api/pitches/generate
 * Triggers the AI brand pitch generation pipeline.
 */
router.post('/generate', async (req, res, next) => {
  try {
    // In a real app, the user object would come from authentication middleware (e.g., req.user)
    const mockUser = { id: 'clxrz45gn000008l4hy285p0g', roles: [{ role: { name: 'admin' } }] };
    const { brandName, briefId, dealId, type, personaMode } = req.body;

    const pitch = await generateBrandPitch({ user: mockUser, brandName, briefId, dealId, type, personaMode });
    res.status(201).json({ ok: true, pitchId: pitch.id, output: pitch.aiOutput });
  } catch (error) {
    next(error);
  }
});

export default router;