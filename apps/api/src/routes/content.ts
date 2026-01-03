import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { isAdmin, isSuperAdmin } from "../lib/roleHelpers.js";
import { logAdminActivity } from "../lib/adminActivityLogger.js";
import { z } from "zod";

/**
 * System-defined CMS pages that cannot be deleted or modified (slug/roleScope)
 * These are the only approved pages for CMS editing
 */
const SYSTEM_PAGE_SLUGS = [
  "welcome",
  "creator-dashboard",
  "founder-dashboard",
  "resources",
  "announcements",
  "empty-states",
];

function isSystemPage(slug: string): boolean {
  return SYSTEM_PAGE_SLUGS.includes(slug);
}

const router = Router();

// All CMS routes require superadmin access
router.use(requireAuth);
router.use((req: Request, res: Response, next) => {
  if (!isSuperAdmin(req.user!)) {
    return res.status(403).json({ error: "Forbidden: Superadmin access required" });
  }
  next();
});

// ============================================
// CONTENT VALIDATION SCHEMAS
// ============================================

const HeroBlockSchema = z.object({
  image: z.string().url().optional(),
  headline: z.string().min(1).max(200),
  subheadline: z.string().max(500).optional(),
  primaryCtaText: z.string().max(100).optional(),
  primaryCtaLink: z.string().url().optional(),
}).strict();

const TextBlockSchema = z.object({
  headline: z.string().max(200).optional(),
  body: z.string().max(5000),
  link: z.string().url().optional(),
  linkText: z.string().max(100).optional(),
}).strict();

const ImageBlockSchema = z.object({
  image: z.string().url(),
  caption: z.string().max(500).optional(),
  aspectRatio: z.enum(["16:9", "4:3", "1:1", "3:2"]).optional(),
}).strict();

const SplitBlockSchema = z.object({
  image: z.string().url(),
  imagePosition: z.enum(["left", "right"]).default("left"),
  headline: z.string().max(200),
  body: z.string().max(5000),
  ctaText: z.string().max(100).optional(),
  ctaLink: z.string().url().optional(),
}).strict();

const AnnouncementBlockSchema = z.object({
  message: z.string().min(1).max(1000),
  ctaText: z.string().max(100).optional(),
  ctaLink: z.string().url().optional(),
  variant: z.enum(["info", "success", "warning"]).default("info"),
}).strict();

const SpacerBlockSchema = z.object({
  size: z.enum(["sm", "md", "lg"]).default("md"),
}).strict();

/**
 * Validate content JSON based on block type
 */
function validateBlockContent(blockType: string, content: any): { valid: boolean; error?: string } {
  try {
    let schema;
    switch (blockType) {
      case "HERO":
        schema = HeroBlockSchema;
        break;
      case "TEXT":
        schema = TextBlockSchema;
        break;
      case "IMAGE":
        schema = ImageBlockSchema;
        break;
      case "SPLIT":
        schema = SplitBlockSchema;
        break;
      case "ANNOUNCEMENT":
        schema = AnnouncementBlockSchema;
        break;
      case "SPACER":
        schema = SpacerBlockSchema;
        break;
      default:
        return { valid: false, error: `Unknown block type: ${blockType}` };
    }

    schema.parse(content);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ") };
    }
    return { valid: false, error: "Invalid content format" };
  }
}

/**
 * Sanitize content JSON to prevent XSS and injection
 */
function sanitizeContent(content: any): any {
  // Recursively sanitize strings to remove HTML/script tags
  const sanitizeString = (str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<[^>]+>/g, "")
      .trim();
  };

  const sanitize = (obj: any): any => {
    if (typeof obj === "string") {
      return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };

  return sanitize(content);
}

// ============================================
// PAGE ROUTES
// ============================================

/**
 * GET /api/content/pages
 * List all pages
 */
router.get("/pages", async (req: Request, res: Response) => {
  try {
    const pages = await prisma.page.findMany({
      include: {
        _count: {
          select: {
            blocks: true,
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    });

    console.log(`[CMS] GET /pages: Found ${pages.length} pages`);
    res.json({ pages });
  } catch (error) {
    console.error("[CMS] Failed to fetch pages:", error);
    res.status(500).json({ error: "Failed to fetch pages" });
  }
});

/**
 * GET /api/content/pages/:slug
 * Get page with blocks (published only, or drafts if preview=true)
 */
router.get("/pages/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const preview = req.query.preview === "true";
    
    // Preview mode requires superadmin access
    if (preview && !isSuperAdmin(req.user!)) {
      return res.status(403).json({ error: "Forbidden: Preview mode requires superadmin access" });
    }

    const page = await prisma.page.findUnique({
      where: { slug },
      include: {
        blocks: {
          where: { isVisible: true },
          orderBy: { order: "asc" },
        },
        drafts: preview
          ? {
              orderBy: { order: "asc" },
            }
          : undefined,
      },
    });

    if (!page) {
      return res.status(404).json({ error: "Page not found" });
    }

    // If preview mode, return drafts; otherwise return published blocks
    const blocks = preview ? page.drafts : page.blocks;

    res.json({
      page: {
        id: page.id,
        slug: page.slug,
        title: page.title,
        roleScope: page.roleScope,
        isActive: page.isActive,
      },
      blocks: blocks.map((block: any) => ({
        id: block.id,
        blockType: block.blockType,
        contentJson: block.contentJson,
        order: block.order,
        isVisible: block.isVisible,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch page:", error);
    res.status(500).json({ error: "Failed to fetch page" });
  }
});

// ============================================
// BLOCK ROUTES
// ============================================

/**
 * POST /api/content/pages/:slug/blocks
 * Create a new block on a page
 */
router.post("/pages/:slug/blocks", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { blockType, contentJson, order, isVisible } = req.body;

    // Validate page exists
    const page = await prisma.page.findUnique({ where: { slug } });
    if (!page) {
      return res.status(404).json({ error: "Page not found" });
    }

    // Validate block type
    const validBlockTypes = ["HERO", "TEXT", "IMAGE", "SPLIT", "ANNOUNCEMENT", "SPACER"];
    if (!validBlockTypes.includes(blockType)) {
      return res.status(400).json({ error: `Invalid block type. Must be one of: ${validBlockTypes.join(", ")}` });
    }

    // Validate and sanitize content
    const validation = validateBlockContent(blockType, contentJson);
    if (!validation.valid) {
      return res.status(400).json({ error: `Invalid content: ${validation.error}` });
    }

    const sanitizedContent = sanitizeContent(contentJson);

    // Get max order for this page
    const maxOrder = await prisma.pageBlock.findFirst({
      where: { pageId: page.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = order !== undefined ? order : (maxOrder?.order ?? -1) + 1;

    // Create block
    const block = await prisma.pageBlock.create({
      data: {
        pageId: page.id,
        blockType,
        contentJson: sanitizedContent,
        order: newOrder,
        isVisible: isVisible !== undefined ? isVisible : true,
        createdBy: req.user!.id,
      },
    });

    // Log activity
    try {
      await logAdminActivity(req as any, {
        event: "CMS_BLOCK_CREATED",
        metadata: {
          pageId: page.id,
          pageSlug: slug,
          blockId: block.id,
          blockType,
        },
      });
    } catch (logError) {
      console.error("Failed to log admin activity:", logError);
    }

    res.status(201).json({ block });
  } catch (error) {
    console.error("Failed to create block:", error);
    res.status(500).json({ error: "Failed to create block" });
  }
});

/**
 * PUT /api/content/blocks/:id
 * Update a block
 */
router.put("/blocks/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { contentJson, order, isVisible } = req.body;

    // Get existing block
    const existing = await prisma.pageBlock.findUnique({
      where: { id },
      include: { Page: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Block not found" });
    }

    const updateData: any = {};

    // Update content if provided
    if (contentJson !== undefined) {
      const validation = validateBlockContent(existing.blockType, contentJson);
      if (!validation.valid) {
        return res.status(400).json({ error: `Invalid content: ${validation.error}` });
      }
      updateData.contentJson = sanitizeContent(contentJson);
    }

    // Update order if provided
    if (order !== undefined) {
      updateData.order = order;
    }

    // Update visibility if provided
    if (isVisible !== undefined) {
      updateData.isVisible = isVisible;
    }

    const block = await prisma.pageBlock.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    try {
      await logAdminActivity(req as any, {
        event: "CMS_BLOCK_UPDATED",
        metadata: {
          blockId: id,
          pageId: existing.pageId,
          pageSlug: existing.Page.slug,
          changes: Object.keys(updateData),
        },
      });
    } catch (logError) {
      console.error("Failed to log admin activity:", logError);
    }

    res.json({ block });
  } catch (error) {
    console.error("Failed to update block:", error);
    res.status(500).json({ error: "Failed to update block" });
  }
});

/**
 * DELETE /api/content/blocks/:id
 * Delete a block
 */
router.delete("/blocks/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.pageBlock.findUnique({
      where: { id },
      include: { Page: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Block not found" });
    }

    await prisma.pageBlock.delete({ where: { id } });

    // Log activity
    try {
      await logAdminActivity(req as any, {
        event: "CMS_BLOCK_DELETED",
        metadata: {
          blockId: id,
          pageId: existing.pageId,
          pageSlug: existing.Page.slug,
          blockType: existing.blockType,
        },
      });
    } catch (logError) {
      console.error("Failed to log admin activity:", logError);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete block:", error);
    res.status(500).json({ error: "Failed to delete block" });
  }
});

/**
 * POST /api/content/blocks/:id/duplicate
 * Duplicate a block
 */
router.post("/blocks/:id/duplicate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.pageBlock.findUnique({
      where: { id },
      include: { Page: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Block not found" });
    }

    // Get max order for this page
    const maxOrder = await prisma.pageBlock.findFirst({
      where: { pageId: existing.pageId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newBlock = await prisma.pageBlock.create({
      data: {
        pageId: existing.pageId,
        blockType: existing.blockType,
        contentJson: existing.contentJson,
        order: (maxOrder?.order ?? existing.order) + 1,
        isVisible: existing.isVisible,
        createdBy: req.user!.id,
      },
    });

    // Log activity
    try {
      await logAdminActivity(req as any, {
        event: "CMS_BLOCK_DUPLICATED",
        metadata: {
          originalBlockId: id,
          newBlockId: newBlock.id,
          pageId: existing.pageId,
        },
      });
    } catch (logError) {
      console.error("Failed to log admin activity:", logError);
    }

    res.status(201).json({ block: newBlock });
  } catch (error) {
    console.error("Failed to duplicate block:", error);
    res.status(500).json({ error: "Failed to duplicate block" });
  }
});

/**
 * POST /api/content/pages/:slug/blocks/reorder
 * Reorder blocks on a page
 */
router.post("/pages/:slug/blocks/reorder", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { blockIds } = req.body; // Array of block IDs in new order

    if (!Array.isArray(blockIds)) {
      return res.status(400).json({ error: "blockIds must be an array" });
    }

    const page = await prisma.page.findUnique({ where: { slug } });
    if (!page) {
      return res.status(404).json({ error: "Page not found" });
    }

    // Update order for each block
    await Promise.all(
      blockIds.map((blockId: string, index: number) =>
        prisma.pageBlock.update({
          where: { id: blockId },
          data: { order: index },
        })
      )
    );

    // Log activity
    try {
      await logAdminActivity(req as any, {
        event: "CMS_BLOCKS_REORDERED",
        metadata: {
          pageId: page.id,
          pageSlug: slug,
          blockCount: blockIds.length,
        },
      });
    } catch (logError) {
      console.error("Failed to log admin activity:", logError);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder blocks:", error);
    res.status(500).json({ error: "Failed to reorder blocks" });
  }
});

// ============================================
// DRAFT ROUTES (Preview Mode)
// ============================================

/**
 * POST /api/content/pages/:slug/drafts
 * Save draft blocks for preview
 */
router.post("/pages/:slug/drafts", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { blocks } = req.body; // Array of block data

    if (!Array.isArray(blocks)) {
      return res.status(400).json({ error: "blocks must be an array" });
    }

    const page = await prisma.page.findUnique({ where: { slug } });
    if (!page) {
      return res.status(404).json({ error: "Page not found" });
    }

    // Delete existing drafts
    await prisma.pageBlockDraft.deleteMany({ where: { pageId: page.id } });

    // Create new drafts
    const createdDrafts = await Promise.all(
      blocks.map(async (block: any, index: number) => {
        // Validate block type and content
        const validBlockTypes = ["HERO", "TEXT", "IMAGE", "SPLIT", "ANNOUNCEMENT", "SPACER"];
        if (!validBlockTypes.includes(block.blockType)) {
          throw new Error(`Invalid block type: ${block.blockType}`);
        }

        const validation = validateBlockContent(block.blockType, block.contentJson);
        if (!validation.valid) {
          throw new Error(`Invalid content: ${validation.error}`);
        }

        return prisma.pageBlockDraft.create({
          data: {
            pageId: page.id,
            blockId: block.id || null, // null for new blocks
            blockType: block.blockType,
            contentJson: sanitizeContent(block.contentJson),
            order: index,
            isVisible: block.isVisible !== undefined ? block.isVisible : true,
            createdBy: req.user!.id,
          },
        });
      })
    );

    res.json({ drafts: createdDrafts });
  } catch (error) {
    console.error("Failed to save drafts:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to save drafts" });
  }
});

/**
 * POST /api/content/pages/:slug/publish
 * Publish draft blocks to live blocks
 */
router.post("/pages/:slug/publish", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const page = await prisma.page.findUnique({
      where: { slug },
      include: { drafts: true },
    });

    if (!page) {
      return res.status(404).json({ error: "Page not found" });
    }

    // Publish operation wrapped in transaction for atomicity
    const publishedBlocks = await prisma.$transaction(async (tx) => {
      // Delete all existing blocks
      await tx.pageBlock.deleteMany({ where: { pageId: page.id } });

      // Create blocks from drafts
      const newBlocks = await Promise.all(
        page.drafts.map((draft) =>
          tx.pageBlock.create({
            data: {
              pageId: page.id,
              blockType: draft.blockType,
              contentJson: draft.contentJson,
              order: draft.order,
              isVisible: draft.isVisible,
              createdBy: draft.createdBy || req.user!.id,
            },
          })
        )
      );

      // Clear drafts after publishing
      await tx.pageBlockDraft.deleteMany({ where: { pageId: page.id } });

      return newBlocks;
    });

    // Log activity
    try {
      await logAdminActivity(req as any, {
        event: "CMS_PAGE_PUBLISHED",
        metadata: {
          pageId: page.id,
          pageSlug: slug,
          blockCount: publishedBlocks.length,
        },
      });
    } catch (logError) {
      console.error("Failed to log admin activity:", logError);
    }

    res.json({ blocks: publishedBlocks });
  } catch (error) {
    console.error("Failed to publish page:", error);
    res.status(500).json({ error: "Failed to publish page" });
  }
});

export default router;

