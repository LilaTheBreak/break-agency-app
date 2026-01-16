import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as opportunityService from "../services/ai/aiOpportunitySuggestionService.js";
import prisma from "../lib/prisma.js";
import { logAIInteraction } from "../lib/aiHistoryLogger.js";

/**
 * POST /api/admin/talent/:talentId/ai-suggestions
 * Generate AI suggestions for a talent
 */
export async function generateAISuggestions(req: Request, res: Response, next: NextFunction) {
  try {
    const { id: talentId } = req.params;
    const userId = (req as any).user?.id;

    if (!talentId) {
      return res.status(400).json({
        success: false,
        error: "Talent ID required",
      });
    }

    // Verify talent exists and is EXCLUSIVE
    const talent = await prisma.talent.findUnique({
      where: { id: talentId },
      select: { representationType: true, name: true },
    });

    if (!talent) {
      return res.status(404).json({
        success: false,
        error: "Talent not found",
      });
    }

    if (talent.representationType !== "EXCLUSIVE") {
      return res.status(403).json({
        success: false,
        error: "Feature only available for EXCLUSIVE talent",
      });
    }

    // Generate suggestions
    const result = await opportunityService.generateOpportunitySuggestions(talentId);

    // Log interaction
    if (userId) {
      await logAIInteraction(
        userId,
        `Generate AI opportunity suggestions for talent: ${talent.name}`,
        JSON.stringify(result),
        "opportunity_suggestions",
        { talentId, suggestionCount: result.suggestions?.length || 0 }
      ).catch(() => {}); // Silently fail logging
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[AI SUGGESTIONS] Generation error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate suggestions",
    });
  }
}

/**
 * GET /api/admin/talent/:talentId/ai-suggestions
 * Get suggestions for a talent
 */
export async function getTalentSuggestions(req: Request, res: Response, next: NextFunction) {
  try {
    const { id: talentId } = req.params;
    const { status } = req.query;

    if (!talentId) {
      return res.status(400).json({
        success: false,
        error: "Talent ID required",
      });
    }

    // Verify talent exists
    const talent = await prisma.talent.findUnique({
      where: { id: talentId },
      select: { id: true },
    });

    if (!talent) {
      return res.status(404).json({
        success: false,
        error: "Talent not found",
      });
    }

    const result = await opportunityService.getTalentSuggestions(
      talentId,
      status as string | undefined
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("[AI SUGGESTIONS] Fetch error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch suggestions",
    });
  }
}

/**
 * PATCH /api/admin/talent/:talentId/ai-suggestions/:suggestionId
 * Update suggestion status (dismiss, save)
 */
export async function updateSuggestion(req: Request, res: Response, next: NextFunction) {
  try {
    const { id: talentId, suggestionId } = req.params;
    const { status } = req.body;
    const userId = (req as any).user?.id;

    // Validate status
    const validStatuses = ["suggested", "saved", "dismissed"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be one of: suggested, saved, dismissed",
      });
    }

    // Verify suggestion belongs to talent
    const suggestion = await (prisma as any).aiSuggestedOpportunity.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion || suggestion.talentId !== talentId) {
      return res.status(404).json({
        success: false,
        error: "Suggestion not found",
      });
    }

    const result = await opportunityService.updateSuggestionStatus(suggestionId, status);

    // Log interaction
    if (userId) {
      await logAIInteraction(
        userId,
        `Update AI suggestion status to ${status}`,
        JSON.stringify(result),
        "opportunity_suggestion_update",
        { talentId, suggestionId, newStatus: status }
      ).catch(() => {});
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[AI SUGGESTIONS] Update error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update suggestion",
    });
  }
}

/**
 * POST /api/admin/talent/:talentId/ai-suggestions/:suggestionId/convert
 * Convert suggestion to actual Opportunity
 */
export async function convertSuggestion(req: Request, res: Response, next: NextFunction) {
  try {
    const { id: talentId, suggestionId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    // Verify suggestion belongs to talent
    const suggestion = await (prisma as any).aiSuggestedOpportunity.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion || suggestion.talentId !== talentId) {
      return res.status(404).json({
        success: false,
        error: "Suggestion not found",
      });
    }

    const result = await opportunityService.convertSuggestionToOpportunity(suggestionId, userId);

    // Log interaction
    if (result.success) {
      await logAIInteraction(
        userId,
        `Convert AI opportunity suggestion to actual opportunity`,
        JSON.stringify(result),
        "opportunity_suggestion_converted",
        { talentId, suggestionId, opportunityId: result.opportunity?.id }
      ).catch(() => {});
    }

    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error("[AI SUGGESTIONS] Conversion error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to convert suggestion",
    });
  }
}
