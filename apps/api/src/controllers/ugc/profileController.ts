import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create or update UGC creator profile
 * POST /api/ugc/profile
 */
export async function createOrUpdateProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { displayName, country, categories, socials } = req.body;

    // Validate required fields
    if (!displayName || !country || !categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ error: 'displayName, country, and at least one category are required' });
    }

    // Update User model with UGC profile data
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: displayName,
        location: country,
        ugc_categories: categories,
        socialLinks: socials || {},
        onboardingComplete: true,
        onboarding_status: 'approved' // UGC creators don't need approval
      }
    });

    return res.status(200).json({
      success: true,
      profile: {
        displayName: updatedUser.name,
        country: updatedUser.location,
        categories: updatedUser.ugc_categories,
        socials: updatedUser.socialLinks
      }
    });
  } catch (error) {
    console.error('[UGC PROFILE] Error:', error);
    return res.status(500).json({ error: 'Failed to save profile' });
  }
}

/**
 * Get my UGC profile
 * GET /api/ugc/profile
 */
export async function getMyProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        location: true,
        ugc_categories: true,
        socialLinks: true,
        onboardingComplete: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.status(200).json({
      profile: {
        displayName: user.name,
        country: user.location,
        categories: user.ugc_categories,
        socials: user.socialLinks,
        isComplete: user.onboardingComplete
      }
    });
  } catch (error) {
    console.error('[UGC PROFILE] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
}
