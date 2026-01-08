import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { isAdmin, isSuperAdmin } from "../lib/roleHelpers.js";
import { logAdminActivity } from "../lib/adminActivityLogger.js";
import { z } from "zod";
import { ensureCmsPagesExist } from "../lib/cmsSeeder.js";
import { hydrateAllCmsPages, hydrateCmsPage } from "../lib/cmsHydration.js";
import { CMS_PUBLIC_PAGES, getEditableSlugs, isEditableCmsPage } from "../lib/cmsPageRegistry.js";

/**
 * System-defined CMS pages that cannot be deleted or modified (slug/roleScope)
 * These are the only approved pages for CMS editing
 * 
 * @deprecated Use CMS_PUBLIC_PAGES registry instead for editable pages
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

// ============================================================================
// PUBLIC READ-ONLY CMS ENDPOINT (No Authentication Required)
// Must be defined BEFORE the auth middleware
// ============================================================================

/**
 * Public CMS allowlist - only these slugs are accessible via public endpoint
 * This should match CMS_PUBLIC_PAGES registry slugs
 */
const PUBLIC_CMS_ALLOWLIST = [
  "welcome",
  "resources",
  "careers",
  "press",
  "help",
  "contact",
  "legal",
  "privacy-policy",
] as const;

/**
 * GET /api/content/public/:slug
 * 
 * Public read-only endpoint for CMS pages.
 * - No authentication required
 * - Returns only published + visible blocks
 * - Never returns drafts
 * - Only allows slugs in PUBLIC_CMS_ALLOWLIST
 */
router.get("/public/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // Hard allowlist check - only allow specific public pages
    if (!PUBLIC_CMS_ALLOWLIST.includes(slug as any)) {
      return res.status(404).json({ error: "Page not found" });
    }

    // Find the page
    const page = await prisma.page.findUnique({
      where: { slug },
      include: {
        blocks: {
          where: {
            isVisible: true, // Only visible blocks
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!page) {
      return res.status(404).json({ error: "Page not found" });
    }

    if (!page.isActive) {
      return res.status(404).json({ error: "Page not found" });
    }

    // Return only published blocks (no drafts, no admin metadata)
    const publicBlocks = page.blocks.map((block) => ({
      id: block.id,
      blockType: block.blockType,
      contentJson: block.contentJson,
      order: block.order,
      // Explicitly exclude: createdBy, updatedAt, pageId, isVisible (already filtered)
    }));

    return res.json({
      slug: page.slug,
      title: page.title,
      blocks: publicBlocks,
    });
  } catch (error) {
    console.error("[CMS Public] Error fetching public page:", error);
    return res.status(500).json({ error: "Failed to fetch page" });
  }
});

// All other CMS routes require superadmin access
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
      return { valid: false, error: error.issues.map(e => `${e.path.join(".")}: ${e.message}`).join(", ") };
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
 * POST /api/content/seed
 * Manually trigger CMS page seeding (Superadmin only, for immediate seeding)
 */
router.post("/seed", async (req: Request, res: Response) => {
  try {
    const result = await ensureCmsPagesExist();
    return res.json({
      success: true,
      message: `CMS pages verified. Created: ${result.created}, Skipped: ${result.skipped}`,
      created: result.created,
      skipped: result.skipped,
    });
  } catch (error) {
    console.error("[CMS] Manual seeding failed:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to seed CMS pages",
    });
  }
});

/**
 * POST /api/content/hydrate
 * One-time hydration: Convert existing hardcoded content to CMS blocks
 * Only hydrates pages that have zero blocks (idempotent, safe to re-run)
 */
router.post("/hydrate", async (req: Request, res: Response) => {
  try {
    const { pageSlug } = req.body;

    if (pageSlug) {
      // Hydrate single page
      const result = await hydrateCmsPage(pageSlug);
      return res.json({
        success: true,
        hydrated: result.hydrated,
        blocksCreated: result.blocksCreated,
        message: result.hydrated
          ? `Hydrated ${pageSlug}: Created ${result.blocksCreated} blocks`
          : `Page ${pageSlug} already has blocks or not found`,
      });
    } else {
      // Hydrate all pages
      const result = await hydrateAllCmsPages();
      return res.json({
        success: true,
        totalHydrated: result.totalHydrated,
        totalBlocksCreated: result.totalBlocksCreated,
        results: result.results,
        message: `Hydrated ${result.totalHydrated} pages, created ${result.totalBlocksCreated} blocks`,
      });
    }
  } catch (error) {
    console.error("[CMS] Hydration failed:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to hydrate CMS pages",
    });
  }
});

/**
 * GET /api/content/pages
 * List only editable CMS pages (filtered by registry)
 * 
 * This endpoint returns ONLY pages that are:
 * - In the CMS_PUBLIC_PAGES registry
 * - Actually editable via CMS
 * - Mapped to real routes/components
 * 
 * Dashboard pages, admin pages, and internal pages are excluded.
 */
router.get("/pages", async (req: Request, res: Response) => {
  try {
    // Get editable slugs from registry
    const editableSlugs = getEditableSlugs();
    
    if (editableSlugs.length === 0) {
      console.log("[CMS] GET /pages: No editable pages in registry");
      return res.json({ pages: [] });
    }

    // Fetch only pages that are in the registry
    const dbPages = await prisma.page.findMany({
      where: {
        slug: { in: editableSlugs },
        isActive: true, // Only active pages
      },
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

    // Enrich with registry data (route, component, display title)
    const enrichedPages = dbPages
      .map((dbPage) => {
        const registryPage = CMS_PUBLIC_PAGES.find((p) => p.slug === dbPage.slug);
        if (!registryPage) {
          // This shouldn't happen if filtering works, but log if it does
          console.warn(`[CMS] Page ${dbPage.slug} found in DB but not in registry`);
          return null;
        }
        return {
          ...dbPage,
          // Override title with registry title (friendly display name)
          title: registryPage.title,
          // Add route and component from registry
          route: registryPage.route,
          component: registryPage.component,
          editable: registryPage.editable,
        };
      })
      .filter((page): page is NonNullable<typeof page> => page !== null);

    console.log(`[CMS] GET /pages: Found ${enrichedPages.length} editable pages (filtered from ${dbPages.length} DB pages)`);
    res.json({ pages: enrichedPages });
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

    // Validate that this slug is editable (in registry)
    if (!isEditableCmsPage(slug)) {
      console.warn(`[CMS] Attempt to access non-editable page: ${slug}`);
      return res.status(404).json({ error: "Page not found or not editable" });
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

    // Get registry data for this page
    const registryPage = CMS_PUBLIC_PAGES.find((p) => p.slug === slug);

    // If preview mode, return drafts; otherwise return published blocks
    const blocks = preview ? page.drafts : page.blocks;

    res.json({
      page: {
        id: page.id,
        slug: page.slug,
        title: registryPage?.title || page.title, // Use registry title if available
        roleScope: page.roleScope,
        isActive: page.isActive,
        route: registryPage?.route, // Include route from registry
        component: registryPage?.component, // Include component from registry
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

    // Validate that this slug is editable (in registry)
    if (!isEditableCmsPage(slug)) {
      console.warn(`[CMS] Attempt to create block on non-editable page: ${slug}`);
      return res.status(404).json({ error: "Page not found or not editable" });
    }

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

    // Validate that this slug is editable (in registry)
    if (!isEditableCmsPage(slug)) {
      console.warn(`[CMS] Attempt to reorder blocks on non-editable page: ${slug}`);
      return res.status(404).json({ error: "Page not found or not editable" });
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
 * 
 * Only allows editing pages that are in the CMS_PUBLIC_PAGES registry.
 */
router.post("/pages/:slug/drafts", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { blocks } = req.body; // Array of block data

    if (!Array.isArray(blocks)) {
      return res.status(400).json({ error: "blocks must be an array" });
    }

    // Validate that this slug is editable (in registry)
    if (!isEditableCmsPage(slug)) {
      console.warn(`[CMS] Attempt to save drafts on non-editable page: ${slug}`);
      return res.status(404).json({ error: "Page not found or not editable" });
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
 * 
 * Only allows editing pages that are in the CMS_PUBLIC_PAGES registry.
 */
router.post("/pages/:slug/publish", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // Validate that this slug is editable (in registry)
    if (!isEditableCmsPage(slug)) {
      console.warn(`[CMS] Attempt to publish non-editable page: ${slug}`);
      return res.status(404).json({ error: "Page not found or not editable" });
    }

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

