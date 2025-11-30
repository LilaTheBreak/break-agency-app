import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { personaExtractionQueue } from '../worker/queues/personaQueues.js';
import { applyPersona } from '../services/ai/persona/personaApplier.js';

const router = Router();

/**
 * POST /api/persona/:talentId/generate
 * Triggers the persona generation pipeline for a talent.
 */
router.post('/:talentId/generate', async (req, res) => {
  const { talentId } = req.params;
  await personaExtractionQueue.add('generate-persona', { talentId });
  res.status(202).json({ message: 'AI persona generation has been queued.' });
});

/**
 * GET /api/persona/:talentId
 * Fetches the creator persona profile for a talent.
 */
router.get('/:talentId', async (req, res, next) => {
  try {
    const talent = await prisma.talent.findUnique({ where: { id: req.params.talentId } });
    if (!talent) return res.status(404).json({ error: 'Talent not found' });
    const persona = await prisma.creatorPersonaProfile.findUnique({ where: { userId: talent.userId } });
    res.json(persona);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/persona/:talentId/apply
 * Rewrites a piece of text using the creator's persona.
 */
router.post('/:talentId/apply', async (req, res, next) => {
  try {
    const talent = await prisma.talent.findUnique({ where: { id: req.params.talentId } });
    if (!talent) return res.status(404).json({ error: 'Talent not found' });
    const persona = await prisma.creatorPersonaProfile.findUnique({ where: { userId: talent.userId } });
    if (!persona) return res.status(404).json({ error: 'Persona not generated for this talent yet.' });

    const rewrittenText = await applyPersona(req.body.text, persona);
    res.json({ rewrittenText });
  } catch (error) {
    next(error);
  }
});

export default router;