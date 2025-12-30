import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import prisma from "../lib/prisma.js";
import { logError } from "../lib/logger.js";
import { logAuditEvent } from "../lib/auditLogger.js";
import { isFeatureEnabled } from "../config/features.js";

// Note: This import will need to be created if it doesn't exist
// For now, using a simple check

const router = Router();

// Phase 5: Feature flag check middleware
const checkBriefsEnabled = (req: Request, res: Response, next: Function) => {
  const enabled = process.env.BRIEFS_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({
      error: "Briefs feature is disabled",
      message: "This feature is currently disabled. Contact an administrator to enable it.",
      code: "FEATURE_DISABLED"
    });
  }
  next();
};

router.use(requireAuth, checkBriefsEnabled);

/**
 * GET /api/briefs
 * List all briefs (admin/brand only)
 */
router.get("/", requireRole(['ADMIN', 'SUPERADMIN', 'BRAND']), async (req: Request, res: Response) => {
  try {
    const { brandId, status } = req.query;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const where: any = {};
    
    // Brand users can only see their own briefs
    if (userRole === 'BRAND') {
      where.brandId = brandId || undefined;
      where.createdBy = userId;
    } else if (brandId) {
      where.brandId = brandId as string;
    }
    
    if (status) {
      where.status = status as string;
    }

    const briefs = await prisma.brandBrief.findMany({
      where,
      include: {
        BriefMatch: {
          select: {
            id: true,
            creatorId: true,
            matchScore: true,
            status: true
          }
        },
        _count: {
          select: {
            BriefMatch: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ briefs });
  } catch (error) {
    logError("Failed to fetch briefs", error, { userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to fetch briefs",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/briefs
 * Create a new brief (admin/brand only)
 */
router.post("/", requireRole(['ADMIN', 'SUPERADMIN', 'BRAND']), async (req: Request, res: Response) => {
  try {
    const {
      brandId,
      title,
      description,
      deliverables = [],
      budget,
      deadline,
      status = "draft"
    } = req.body;

    if (!brandId || !title) {
      return res.status(400).json({ 
        error: "brandId and title are required" 
      });
    }

    // Verify brand exists
    const brand = await prisma.brand.findUnique({
      where: { id: brandId }
    });

    if (!brand) {
      return res.status(404).json({ 
        error: "Brand not found" 
      });
    }

    const brief = await prisma.brandBrief.create({
      data: {
        id: `brief_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        brandId,
        title,
        description: description || null,
        deliverables: Array.isArray(deliverables) ? deliverables : [],
        budget: budget || null,
        deadline: deadline ? new Date(deadline) : null,
        status,
        createdBy: req.user!.id,
        versionHistory: [{
          at: new Date().toISOString(),
          label: "Brief created",
          data: { title, status }
        }]
      },
      include: {
        _count: {
          select: {
            BriefMatch: true
          }
        }
      }
    });

    // Audit log
    try {
      await logAuditEvent(req as any, {
        action: "BRIEF_CREATED",
        entityType: "BrandBrief",
        entityId: brief.id,
        metadata: { brandId, title, status }
      });
    } catch (logError) {
      console.error("Failed to log audit event:", logError);
    }

    res.status(201).json({ brief });
  } catch (error) {
    logError("Failed to create brief", error, { userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to create brief",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/briefs/ingest
 * Ingest brief from external source (admin only)
 */
router.post("/ingest", requireRole(['ADMIN', 'SUPERADMIN']), async (req: Request, res: Response) => {
  try {
    const {
      brandId,
      title,
      description,
      deliverables = [],
      budget,
      deadline,
      source
    } = req.body;

    if (!brandId || !title) {
      return res.status(400).json({ 
        error: "brandId and title are required" 
      });
    }

    const brief = await prisma.brandBrief.create({
      data: {
        id: `brief_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        brandId,
        title,
        description: description || null,
        deliverables: Array.isArray(deliverables) ? deliverables : [],
        budget: budget || null,
        deadline: deadline ? new Date(deadline) : null,
        status: "draft",
        createdBy: req.user!.id,
        metadata: { source: source || "manual" },
        versionHistory: [{
          at: new Date().toISOString(),
          label: "Brief ingested",
          data: { source: source || "manual" }
        }]
      }
    });

    res.status(201).json({ brief });
  } catch (error) {
    logError("Failed to ingest brief", error, { userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to ingest brief",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/briefs/:id
 * Get single brief with matches
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const brief = await prisma.brandBrief.findUnique({
      where: { id },
      include: {
        BriefMatch: {
          include: {
            // Note: creatorId is a string, not a relation in current schema
            // Would need to join with User/Talent if needed
          },
          orderBy: { matchScore: "desc" }
        },
        _count: {
          select: {
            BriefMatch: true
          }
        }
      }
    });

    if (!brief) {
      return res.status(404).json({ 
        error: "Brief not found" 
      });
    }

    // Brand users can only see their own briefs
    if (userRole === 'BRAND' && brief.createdBy !== userId) {
      return res.status(403).json({ 
        error: "Forbidden",
        message: "You can only view briefs you created"
      });
    }

    res.json({ brief });
  } catch (error) {
    logError("Failed to fetch brief", error, { briefId: req.params.id, userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to fetch brief",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/briefs/:id/matches
 * Get creator matches for a brief
 */
router.get("/:id/matches", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, minScore } = req.query;

    // Verify brief exists
    const brief = await prisma.brandBrief.findUnique({
      where: { id }
    });

    if (!brief) {
      return res.status(404).json({ 
        error: "Brief not found" 
      });
    }

    const where: any = {
      briefId: id
    };

    if (status) {
      where.status = status as string;
    }

    if (minScore) {
      where.matchScore = { gte: parseFloat(minScore as string) };
    }

    const matches = await prisma.briefMatch.findMany({
      where,
      orderBy: { matchScore: "desc" },
      take: 50
    });

    res.json({ matches });
  } catch (error) {
    logError("Failed to fetch brief matches", error, { briefId: req.params.id });
    res.status(500).json({ 
      error: "Failed to fetch matches",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/briefs/:id/versions
 * Create a version snapshot
 */
router.post("/:id/versions", requireRole(['ADMIN', 'SUPERADMIN', 'BRAND']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data } = req.body;

    const brief = await prisma.brandBrief.findUnique({
      where: { id },
      select: { versionHistory: true, createdBy: true }
    });

    if (!brief) {
      return res.status(404).json({ 
        error: "Brief not found" 
      });
    }

    // Brand users can only version their own briefs
    if (req.user!.role === 'BRAND' && brief.createdBy !== req.user!.id) {
      return res.status(403).json({ 
        error: "Forbidden" 
      });
    }

    const newVersion = {
      id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      at: new Date().toISOString(),
      label: "Version snapshot",
      data: data || {}
    };

    const updated = await prisma.brandBrief.update({
      where: { id },
      data: {
        versionHistory: [...(Array.isArray(brief.versionHistory) ? brief.versionHistory : []), newVersion]
      }
    });

    res.json({ version: newVersion, brief: updated });
  } catch (error) {
    logError("Failed to create brief version", error, { briefId: req.params.id });
    res.status(500).json({ 
      error: "Failed to create version",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/briefs/:id/versions
 * Get version history
 */
router.get("/:id/versions", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const brief = await prisma.brandBrief.findUnique({
      where: { id },
      select: { versionHistory: true }
    });

    if (!brief) {
      return res.status(404).json({ 
        error: "Brief not found" 
      });
    }

    res.json({ 
      versions: Array.isArray(brief.versionHistory) ? brief.versionHistory : [] 
    });
  } catch (error) {
    logError("Failed to fetch brief versions", error, { briefId: req.params.id });
    res.status(500).json({ 
      error: "Failed to fetch versions",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/briefs/restore/:versionId
 * Restore a version (admin/brand only)
 */
router.post("/restore/:versionId", requireRole(['ADMIN', 'SUPERADMIN', 'BRAND']), async (req: Request, res: Response) => {
  try {
    const { versionId, briefId } = req.body;

    if (!briefId) {
      return res.status(400).json({ 
        error: "briefId is required" 
      });
    }

    const brief = await prisma.brandBrief.findUnique({
      where: { id: briefId },
      select: { versionHistory: true, createdBy: true }
    });

    if (!brief) {
      return res.status(404).json({ 
        error: "Brief not found" 
      });
    }

    // Brand users can only restore their own briefs
    if (req.user!.role === 'BRAND' && brief.createdBy !== req.user!.id) {
      return res.status(403).json({ 
        error: "Forbidden" 
      });
    }

    const versions = Array.isArray(brief.versionHistory) ? brief.versionHistory : [];
    const version = versions.find((v: any) => v.id === versionId);

    if (!version) {
      return res.status(404).json({ 
        error: "Version not found" 
      });
    }

    // Restore version data
    const restored = await prisma.brandBrief.update({
      where: { id: briefId },
      data: {
        ...(version.data || {}),
        versionHistory: [
          ...versions,
          {
            id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            at: new Date().toISOString(),
            label: "Version restored",
            data: { restoredFrom: versionId }
          }
        ]
      }
    });

    res.json({ brief: restored });
  } catch (error) {
    logError("Failed to restore brief version", error, { versionId: req.params.versionId });
    res.status(500).json({ 
      error: "Failed to restore version",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
