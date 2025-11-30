import { Router } from 'express';
import { scoreCreator } from '../services/scoring/creatorScoringEngine.js';
import { handleOnboardingCompletion } from '../workflows/onboarding/creatorScoring.js';

const router = Router();

/**
 * POST /api/scoring/run/:userId
 * Manually triggers the creator scoring pipeline. (Admin only)
 */
router.post('/run/:userId', async (req, res, next) => {
  // In a real app, an auth middleware would check for 'admin' role.
  try {
    const { userId } = req.params;
    const result = await scoreCreator(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/scoring/onboarding
 * Triggered automatically after a user completes the onboarding flow.
 */
router.post('/onboarding', async (req, res, next) => {
  const { userId } = req.body; // The frontend would send the ID of the newly onboarded user.
  await handleOnboardingCompletion(userId);
  res.status(202).json({ message: 'Onboarding completion processed and scoring initiated.' });
});

export default router;