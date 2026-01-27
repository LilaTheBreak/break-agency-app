/**
 * Brand Onboarding API Routes
 * 
 * Handles the complete brand onboarding flow:
 * - Step 1: Company Basics
 * - Step 2: Sign-Up Context
 * - Step 3: Platform Goals
 * - Step 4: Commercial Focus
 * - Step 5: Founder-Led Check (branching logic)
 * - Step 6: Activations & Experiences
 */

import express, { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { z } from 'zod';

const router = express.Router();

// Extend Express Request to include session userId
interface AuthRequest extends Request {
  session?: {
    userId: string;
  };
}

// Validation schemas for each step
const step1Schema = z.object({
  companyName: z.string().min(1, 'Company name required'),
  websiteUrl: z.string().url('Valid URL required').optional().or(z.literal('')),
  industry: z.string().optional(),
  markets: z.array(z.string()).default([]),
  companySize: z.string().optional(),
});

const step2Schema = z.object({
  signerRole: z.string().optional(),
  decisionAuthority: z.enum(['final', 'influencer', 'research']).optional(),
});

const step3Schema = z.object({
  platformGoals: z.array(z.string()).default([]),
});

const step4Schema = z.object({
  primaryObjective: z.string().optional(),
  productFocus: z.string().optional(),
  desiredOutcome: z.string().optional(),
});

const step5Schema = z.object({
  wantsFounderLed: z.boolean().default(false),
});

const step6Schema = z.object({
  interestedInActivations: z.boolean().default(false),
  activationTypes: z.array(z.string()).default([]),
});

/**
 * GET /api/brands/onboarding/current
 * Get current onboarding status and data
 */
router.get('/current', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const brandProfile = await prisma.brandProfile.findUnique({
      where: { userId },
    });

    if (!brandProfile) {
      return res.status(404).json({ error: 'Brand profile not found' });
    }

    res.json(brandProfile);
  } catch (error) {
    console.error('Error fetching brand onboarding status:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding status' });
  }
});

/**
 * POST /api/brands/onboarding/start
 * Initialize brand onboarding
 */
router.post('/start', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if brand profile already exists
    let brandProfile = await prisma.brandProfile.findUnique({
      where: { userId },
    });

    if (!brandProfile) {
      brandProfile = await prisma.brandProfile.create({
        data: {
          userId,
          companyName: '',
          currentStep: 1,
        },
      });
    }

    res.json(brandProfile);
  } catch (error) {
    console.error('Error starting brand onboarding:', error);
    res.status(500).json({ error: 'Failed to start onboarding' });
  }
});

/**
 * POST /api/brands/onboarding/step/1
 * Step 1: Company Basics
 */
router.post('/step/1', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validated = step1Schema.parse(req.body);

    const brandProfile = await prisma.brandProfile.update({
      where: { userId },
      data: {
        companyName: validated.companyName,
        websiteUrl: validated.websiteUrl,
        industry: validated.industry,
        markets: validated.markets,
        companySize: validated.companySize,
        currentStep: 2,
      },
    });

    res.json(brandProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.flatten() });
    }
    console.error('Error saving step 1:', error);
    res.status(500).json({ error: 'Failed to save step 1' });
  }
});

/**
 * POST /api/brands/onboarding/step/2
 * Step 2: Sign-Up Context (WHO is this person?)
 */
router.post('/step/2', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validated = step2Schema.parse(req.body);

    const brandProfile = await prisma.brandProfile.update({
      where: { userId },
      data: {
        signerRole: validated.signerRole,
        decisionAuthority: validated.decisionAuthority,
        currentStep: 3,
      },
    });

    res.json(brandProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.flatten() });
    }
    console.error('Error saving step 2:', error);
    res.status(500).json({ error: 'Failed to save step 2' });
  }
});

/**
 * POST /api/brands/onboarding/step/3
 * Step 3: Platform Goals (WHY are they here?)
 */
router.post('/step/3', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validated = step3Schema.parse(req.body);

    const brandProfile = await prisma.brandProfile.update({
      where: { userId },
      data: {
        platformGoals: validated.platformGoals,
        currentStep: 4,
      },
    });

    res.json(brandProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.flatten() });
    }
    console.error('Error saving step 3:', error);
    res.status(500).json({ error: 'Failed to save step 3' });
  }
});

/**
 * POST /api/brands/onboarding/step/4
 * Step 4: Commercial Focus (WHAT are they trying to achieve?)
 */
router.post('/step/4', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validated = step4Schema.parse(req.body);

    const brandProfile = await prisma.brandProfile.update({
      where: { userId },
      data: {
        primaryObjective: validated.primaryObjective,
        productFocus: validated.productFocus,
        desiredOutcome: validated.desiredOutcome,
        currentStep: 5,
      },
    });

    res.json(brandProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.flatten() });
    }
    console.error('Error saving step 4:', error);
    res.status(500).json({ error: 'Failed to save step 4' });
  }
});

/**
 * POST /api/brands/onboarding/step/5
 * Step 5: Founder-Led Check (CRITICAL BRANCHING LOGIC)
 * 
 * If user selects "Founder-led brand building" AND role = Founder/Co-Founder:
 *   → Redirect to Founder Onboarding Flow
 *   → Persist brand data
 * Otherwise:
 *   → Continue to step 6
 */
router.post('/step/5', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validated = step5Schema.parse(req.body);

    // Get current brand profile to check conditions
    const currentProfile = await prisma.brandProfile.findUnique({
      where: { userId },
    });

    if (!currentProfile) {
      return res.status(404).json({ error: 'Brand profile not found' });
    }

    // Check if conditions for founder-led redirect are met
    const hasFounderLedGoal = validated.wantsFounderLed;
    const isFounder = 
      currentProfile.signerRole?.includes('Founder') || 
      currentProfile.signerRole?.includes('Co-Founder');

    let nextStep = 6;
    let shouldRedirectToFounder = false;

    if (hasFounderLedGoal && isFounder) {
      shouldRedirectToFounder = true;
      nextStep = 5; // Stay on step 5 but mark redirect
    }

    const updatedProfile = await prisma.brandProfile.update({
      where: { userId },
      data: {
        wantsFounderLed: validated.wantsFounderLed,
        founderLedRedirectedAt: shouldRedirectToFounder ? new Date() : null,
        currentStep: nextStep,
      },
    });

    // Return signal to redirect to founder onboarding
    res.json({
      ...updatedProfile,
      redirectToFounderOnboarding: shouldRedirectToFounder,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.flatten() });
    }
    console.error('Error saving step 5:', error);
    res.status(500).json({ error: 'Failed to save step 5' });
  }
});

/**
 * POST /api/brands/onboarding/step/6
 * Step 6: Activations & Experiences (OPTIONAL BUT IMPORTANT)
 * 
 * This is the final step. Completion marks onboarding as done.
 */
router.post('/step/6', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validated = step6Schema.parse(req.body);

    // Save step 6 and mark onboarding as complete
    const brandProfile = await prisma.brandProfile.update({
      where: { userId },
      data: {
        interestedInActivations: validated.interestedInActivations,
        activationTypes: validated.activationTypes,
        currentStep: 6,
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
      ...brandProfile,
      message: 'Brand onboarding completed successfully!',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.flatten() });
    }
    console.error('Error saving step 6:', error);
    res.status(500).json({ error: 'Failed to save step 6' });
  }
});

/**
 * POST /api/brands/onboarding/skip/:stepNumber
 * Skip a non-critical step (allows users to skip optional steps)
 */
router.post('/skip/:stepNumber', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stepNumber = parseInt(req.params.stepNumber);

    // Steps that can be skipped (non-critical)
    const skippableSteps = [1, 6]; // Company basics and activations

    if (!skippableSteps.includes(stepNumber)) {
      return res.status(400).json({ error: `Step ${stepNumber} cannot be skipped` });
    }

    const nextStep = stepNumber + 1;

    const brandProfile = await prisma.brandProfile.update({
      where: { userId },
      data: {
        currentStep: nextStep,
      },
    });

    res.json(brandProfile);
  } catch (error) {
    console.error('Error skipping step:', error);
    res.status(500).json({ error: 'Failed to skip step' });
  }
});

export default router;

