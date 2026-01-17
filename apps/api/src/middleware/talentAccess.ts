import type { Request, Response, NextFunction } from "express";
import prisma from '../lib/prisma.js';
import { isSuperAdmin } from '../lib/roleHelpers.js';

/**
 * Middleware to check if the authenticated user has access to a specific talent
 * Used for talent-specific API endpoints
 */
export async function checkTalentAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const { talentId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!talentId) {
      return res.status(400).json({ error: "talentId is required" });
    }

    // Check if user has access to this talent
    // This could be:
    // 1. The talent themselves (talent.userId === userId)
    // 2. A user with TalentUserAccess
    // 3. An admin user (ADMIN or SUPERADMIN)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Check if user is superadmin or admin - they have access to all talents
    if (user.role === 'SUPERADMIN' || user.role === 'ADMIN') {
      (req as any).talentId = talentId;
      return next();
    }

    // Check if user is the talent
    const talent = await prisma.talent.findUnique({
      where: { id: talentId },
    });

    if (!talent) {
      return res.status(404).json({ error: "Talent not found" });
    }

    if (talent.userId === userId) {
      (req as any).talentId = talentId;
      return next();
    }

    // Check if user has TalentUserAccess to this talent
    const hasAccess = await prisma.talentUserAccess.findFirst({
      where: {
        talentId,
        userId,
      },
    });

    if (hasAccess) {
      (req as any).talentId = talentId;
      return next();
    }

    return res.status(403).json({ 
      error: "You do not have access to this talent's data" 
    });
  } catch (error) {
    console.error("Error in checkTalentAccess middleware:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Middleware to check if the authenticated user has access to a specific deal
 * Used for deal-specific API endpoints
 */
export async function checkDealAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const { dealId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dealId) {
      return res.status(400).json({ error: "dealId is required" });
    }

    // Check if user has access to this deal
    // This could be:
    // 1. The deal owner (talent.userId === userId)
    // 2. A user with TalentUserAccess to the deal's talent
    // 3. An admin user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Check if user is admin
    if (user.role === 'ADMIN') {
      (req as any).dealId = dealId;
      return next();
    }

    // Get the deal to find its talent owner
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    // Get the talent to check if user owns it
    const talent = await prisma.talent.findUnique({
      where: { id: deal.talentId },
    });

    if (!talent) {
      return res.status(404).json({ error: "Talent not found" });
    }

    // Check if user is the deal owner (is the talent)
    if (talent.userId === userId) {
      (req as any).dealId = dealId;
      return next();
    }

    // Check if user has TalentUserAccess to the deal's talent
    const hasAccess = await prisma.talentUserAccess.findFirst({
      where: {
        talentId: deal.talentId,
        userId,
      },
    });

    if (hasAccess) {
      (req as any).dealId = dealId;
      return next();
    }

    return res.status(403).json({ 
      error: "You do not have access to this deal's data" 
    });
  } catch (error) {
    console.error("Error in checkDealAccess middleware:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
