/**
 * Audit Controller
 * 
 * Handles audit source management and status tracking
 */

import { Request, Response } from "express";
import { z } from "zod";
import * as auditSourceService from '../services/auditSourceService.js';
import * as brandUserService from '../services/brandUserService.js';

// Validation schemas
const createAuditSourceSchema = z.object({
  type: z.enum(["website", "social", "community", "product", "campaign"]),
  source: z.string().min(1, "Source is required"),
  metadata: z.record(z.string(), z.any()).optional(),
});

const updateAuditSourceSchema = z.object({
  status: z.enum(["connected", "pending", "error"]).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  error: z.string().optional(),
});

/**
 * Add audit source to brand
 */
export async function addAuditSourceHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { brandId } = req.params;

    // Check if user is brand admin
    const isAdmin = await brandUserService.isBrandAdmin(brandId, user.id);
    if (!isAdmin) {
      res
        .status(403)
        .json({ error: "Only brand admins can manage audit sources" });
      return;
    }

    const validation = createAuditSourceSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.issues });
      return;
    }

    const { type, source, metadata } = validation.data;

    // Check if source already exists
    const exists = await auditSourceService.auditSourceExists(
      brandId,
      type,
      source
    );
    if (exists) {
      res.status(409).json({ error: "This source already exists" });
      return;
    }

    const auditSource = await auditSourceService.upsertAuditSource({
      brandId,
      type,
      source,
      metadata,
    });

    res.status(201).json({
      message: "Audit source added successfully",
      auditSource,
    });
  } catch (error) {
    console.error("[Add Audit Source]", error);
    res.status(500).json({ error: "Failed to add audit source" });
  }
}

/**
 * Get audit sources for brand
 */
export async function getBrandAuditSourcesHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { brandId } = req.params;

    // Check if user is brand member
    const isMember = await brandUserService.isBrandMember(brandId, user.id);
    if (!isMember) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const auditSources = await auditSourceService.getBrandAuditSources(
      brandId
    );

    res.json({
      auditSources,
    });
  } catch (error) {
    console.error("[Get Audit Sources]", error);
    res.status(500).json({ error: "Failed to get audit sources" });
  }
}

/**
 * Get audit summary for brand
 */
export async function getAuditSummaryHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { brandId } = req.params;

    // Check if user is brand member
    const isMember = await brandUserService.isBrandMember(brandId, user.id);
    if (!isMember) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const summary = await auditSourceService.getAuditSummary(brandId);

    res.json({
      summary,
    });
  } catch (error) {
    console.error("[Get Audit Summary]", error);
    res.status(500).json({ error: "Failed to get audit summary" });
  }
}

/**
 * Update audit source
 */
export async function updateAuditSourceHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { auditSourceId, brandId } = req.params;

    // Check if user is brand admin
    const isAdmin = await brandUserService.isBrandAdmin(brandId, user.id);
    if (!isAdmin) {
      res
        .status(403)
        .json({ error: "Only brand admins can update audit sources" });
      return;
    }

    const validation = updateAuditSourceSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.issues });
      return;
    }

    const auditSource =
      await auditSourceService.updateAuditSourceStatus(
        auditSourceId,
        validation.data
      );

    res.json({
      message: "Audit source updated successfully",
      auditSource,
    });
  } catch (error) {
    console.error("[Update Audit Source]", error);
    res.status(500).json({ error: "Failed to update audit source" });
  }
}

/**
 * Delete audit source
 */
export async function deleteAuditSourceHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { auditSourceId, brandId } = req.params;

    // Check if user is brand admin
    const isAdmin = await brandUserService.isBrandAdmin(brandId, user.id);
    if (!isAdmin) {
      res
        .status(403)
        .json({ error: "Only brand admins can delete audit sources" });
      return;
    }

    await auditSourceService.deleteAuditSource(auditSourceId);

    res.json({
      message: "Audit source deleted successfully",
    });
  } catch (error) {
    console.error("[Delete Audit Source]", error);
    res.status(500).json({ error: "Failed to delete audit source" });
  }
}
