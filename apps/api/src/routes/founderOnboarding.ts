/**
 * Founder Onboarding API Routes
 * 
 * Handles the founder-led strategy diagnostic flow:
 * - Step 1: Founder Stage
 * - Step 2: Social Presence Audit
 * - Step 3: Content & Visibility Confidence
 * - Step 4: Founder Goals
 * - Step 5: Commercial Intent
 * - Step 6: Biggest Blocker (Diagnostic)
 */

import express, { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { z } from 'zod';

const router = express.Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Validation schemas for each step
const step1Schema = z.object({
  founderStage: z.enum(['pre_launch', 'early', 'scaling', 'established']),
});

const step2Schema = z.object({
  isActiveOnSocials: z.boolean(),
  primaryPlatforms: z.array(z.string()).default([]),
  currentReach: z.record(z.string(), z.number().optional()).optional(),
  socialBlocker: z.string().optional(),
});

const step3Schema = z.object({
  contentConfidence: z.enum(['low', 'medium', 'high']).optional(),
  timeCommitment: z.enum(['low', 'medium', 'high']).optional(),
});

const step4Schema = z.object({
  primaryFounderGoals: z.array(z.string()).default([]),
});

const step5Schema = z.object({
  commercialIntent: z.string().optional(),
});

const step6Schema = z.object({
  biggestBlocker: z.string().optional(),
});

/**
 * GET /api/founders/onboarding/current
 * Get current onboarding status and data
 */
router.get('/current', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const founderProfile = await prisma.founderProfile.findUnique({
      where: { userId },
    });

    if (!founderProfile) {
      return res.status(404).json({ error: 'Founder profile not found' });
    }

    res.json(founderProfile);
  } catch (error) {
    console.error('Error fetching founder onboarding status:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding status' });
  }
});

/**
 * POST /api/founders/onboarding/start
 * Initialize founder onboarding
 */
router.post('/start', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if founder profile already exists
    let founderProfile = await prisma.founderProfile.findUnique({
      where: { userId },
    });

    if (!founderProfile) {
      founderProfile = await prisma.founderProfile.create({
        data: {
          userId,
          currentStep: 1,
        },
      });
    }

    res.json(founderProfile);
  } catch (error) {
    console.error('Error starting founder onboarding:', error);
    res.status(500).json({ error: 'Failed to start onboarding' });
  }
});

/**
 * POST /api/founders/onboarding/step/1
 * Step 1: Founder Stage
 */
router.post('/step/1', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validated = step1Schema.parse(req.body);

    const founderProfile = await prisma.founderProfile.update({
      where: { userId },
      data: {
        founderStage: validated.founderStage,
        currentStep: 2,
      },
    });

    res.json(founderProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }
    console.error('Error saving step 1:', error);
    res.status(500).json({ error: 'Failed to save step 1' });
  }
});

/**
 * POST /api/founders/onboarding/step/2
 * Step 2: Social Presence Audit
 */
router.post('/step/2', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validated = step2Schema.parse(req.body);

    const founderProfile = await prisma.founderProfile.update({
      where: { userId },
      data: {
        isActiveOnSocials: validated.isActiveOnSocials,
        primaryPlatforms: validated.primaryPlatforms,
        currentReach: validated.currentReach as any,
        socialBlocker: validated.socialBlocker,
        currentStep: 3,
      },
    });

    res.json(founderProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }
    console.error('Error saving step 2:', error);
    res.status(500).json({ error: 'Failed to save step 2' });
  }
});

/**
 * POST /api/founders/onboarding/step/3
 * Step 3: Content & Visibility Confidence
 */
router.post('/step/3', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validated = step3Schema.parse(req.body);

    const founderProfile = await prisma.founderProfile.update({
      where: { userId },
      data: {
        contentConfidence: validated.contentConfidence,
        timeCommitment: validated.timeCommitment,
        currentStep: 4,
      },
    });

    res.json(founderProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }
    console.error('Error saving step 3:', error);
    res.status(500).json({ error: 'Failed to save step 3' });
  }
});

/**
 * POST /api/founders/onboarding/step/4
 * Step 4: Founder Goals
 */
router.post('/step/4', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validated = step4Schema.parse(req.body);

    const founderProfile = await prisma.founderProfile.update({
      where: { userId },
      data: {
        primaryFounderGoals: validated.primaryFounderGoals,
        currentStep: 5,
      },
    });

    res.json(founderProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }
    console.error('Error saving step 4:', error);
    res.status(500).json({ error: 'Failed to save step 4' });
  }
});

/**
 * POST /api/founders/onboarding/step/5
 * Step 5: Commercial Intent
 */
router.post('/step/5', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validated = step5Schema.parse(req.body);

    const founderProfile = await prisma.founderProfile.update({
      where: { userId },
      data: {
        commercialIntent: validated.commercialIntent,
        currentStep: 6,
      },
    });

    res.json(founderProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }
    console.error('Error saving step 5:', error);
    res.status(500).json({ error: 'Failed to save step 5' });
  }
});

/**
 * POST /api/founders/onboarding/step/6
 * Step 6: Biggest Blocker (Final step + Service Mapping)
 */
router.post('/step/6', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validated = step6Schema.parse(req.body);

    // Get current founder profile to build service recommendations
    const currentProfile = await prisma.founderProfile.findUnique({
      where: { userId },
    });

    if (!currentProfile) {
      return res.status(404).json({ error: 'Founder profile not found' });
    }

    // Calculate recommended services based on answers
    const recommendedServices = calculateRecommendedServices(currentProfile, validated);

    // Update founder profile with final step and service recommendations
    const founderProfile = await prisma.founderProfile.update({
      where: { userId },
      data: {
        biggestBlocker: validated.biggestBlocker,
        currentStep: 6,
        recommendedServices,
        onboardingCompletedAt: new Date(),
      },
    });

    // Update user to mark onboarding as complete
    await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingComplete: true,
        onboarding_status: 'completed',
      },
    });

    res.json({
      ...founderProfile,
      message: 'Founder onboarding completed successfully!',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }
    console.error('Error saving step 6:', error);
    res.status(500).json({ error: 'Failed to save step 6' });
  }
});

/**
 * Internal helper: Calculate recommended services based on founder profile
 */
function calculateRecommendedServices(
  profile: any,
  step6Data: any
): string[] {
  const services = new Set<string>();

  // Foundation: Always recommend founder-led strategy
  services.add('Founder-led strategy');

  // Stage-based recommendations
  if (profile.founderStage === 'pre_launch' || profile.founderStage === 'early') {
    services.add('Personal brand positioning');
    services.add('Content planning');
  }

  // Social presence analysis
  if (!profile.isActiveOnSocials) {
    services.add('Content planning');
    services.add('Distribution & growth');
  } else if (profile.primaryPlatforms?.length > 1) {
    services.add('Distribution & growth');
  }

  // Goals-based recommendations
  if (profile.primaryFounderGoals?.includes('Build personal authority')) {
    services.add('Personal brand positioning');
  }
  if (profile.primaryFounderGoals?.includes('Drive inbound brand partnerships')) {
    services.add('Partnership strategy');
  }
  if (profile.primaryFounderGoals?.includes('Position myself as a thought leader')) {
    services.add('Speaking & PR');
  }

  // Commercial intent analysis
  if (profile.commercialIntent?.includes('partnership')) {
    services.add('Partnership strategy');
  }
  if (profile.commercialIntent?.includes('credibility') || profile.commercialIntent?.includes('investor')) {
    services.add('Speaking & PR');
  }

  // Confidence & commitment-based
  if (profile.contentConfidence === 'low' || profile.contentConfidence === 'medium') {
    services.add('Content planning');
  }
  if (profile.timeCommitment === 'high') {
    services.add('Distribution & growth');
  }

  return Array.from(services);
}

export default router;
