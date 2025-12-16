import { Router } from 'express';
import { generateFullPitch } from '../services/aiBriefing/index.js';

const router = Router();

/**
 * POST /api/ai/brief/generate
 * A single endpoint to trigger the entire auto-pitch generation pipeline.
 */
router.post('/generate', async (req, res, next) => {
  const { brandId, creatorId } = req.body;
  if (!brandId || !creatorId) {
    return res.status(400).json({ error: 'brandId and creatorId are required.' });
  }

  try {
    const result = await generateFullPitch({ brandId, creatorId });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;