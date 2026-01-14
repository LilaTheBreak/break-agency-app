/**
 * CMS Content Hydration
 * 
 * One-time migration script to extract existing hardcoded page content
 * and convert it into CMS blocks.
 * 
 * This is idempotent and safe to run multiple times.
 * Only inserts blocks if the page has zero blocks.
 */

import prisma from './prisma.js';
import { BlockType } from "@prisma/client";

/**
 * Default content blocks for each CMS page.
 * These are extracted from existing hardcoded React components.
 * 
 * Structure: pageSlug -> array of blocks (in order)
 */
const DEFAULT_PAGE_BLOCKS: Record<string, Array<{
  blockType: BlockType;
  contentJson: any;
  order: number;
  isVisible: boolean;
}>> = {
  "welcome": [
    {
      blockType: "HERO",
      contentJson: {
        headline: "Welcome to The Break",
        subheadline: "Manage talent, brands, and opportunities all in one place.",
        primaryCtaText: "Get Started",
        primaryCtaLink: "/dashboard",
      },
      order: 0,
      isVisible: true,
    },
    {
      blockType: "TEXT",
      contentJson: {
        headline: "Your Dashboard",
        body: "Access all your tools and insights from one central location. Track deals, manage campaigns, and connect with brands.",
      },
      order: 1,
      isVisible: true,
    },
  ],
  "creator-dashboard": [
    {
      blockType: "HERO",
      contentJson: {
        headline: "Creator Dashboard",
        subheadline: "Manage your partnerships, track performance, and grow your brand.",
        primaryCtaText: "View Opportunities",
        primaryCtaLink: "/opportunities",
      },
      order: 0,
      isVisible: true,
    },
    {
      blockType: "TEXT",
      contentJson: {
        headline: "Your Creator Journey",
        body: "Discover new brand partnerships, manage active campaigns, and track your growth metrics all in one place.",
      },
      order: 1,
      isVisible: true,
    },
  ],
  "founder-dashboard": [
    {
      blockType: "HERO",
      contentJson: {
        headline: "Founder Dashboard",
        subheadline: "Build and scale your creator network with powerful tools and insights.",
        primaryCtaText: "Manage Talent",
        primaryCtaLink: "/admin/talent",
      },
      order: 0,
      isVisible: true,
    },
    {
      blockType: "TEXT",
      contentJson: {
        headline: "Grow Your Agency",
        body: "Track talent performance, manage brand relationships, and scale your operations with data-driven insights.",
      },
      order: 1,
      isVisible: true,
    },
  ],
  "resources": [
    {
      blockType: "HERO",
      contentJson: {
        headline: "Resources Hub",
        subheadline: "Everything you need to succeed as a creator or agency.",
      },
      order: 0,
      isVisible: true,
    },
    {
      blockType: "TEXT",
      contentJson: {
        headline: "Learning Center",
        body: "Access guides, templates, and best practices to help you grow your creator business.",
      },
      order: 1,
      isVisible: true,
    },
  ],
  "announcements": [
    {
      blockType: "ANNOUNCEMENT",
      contentJson: {
        message: "Welcome to The Break! We're here to help you succeed.",
        variant: "info",
      },
      order: 0,
      isVisible: true,
    },
  ],
  "empty-states": [
    {
      blockType: "TEXT",
      contentJson: {
        headline: "No Deals Yet",
        body: "Start by exploring opportunities or connecting with brands.",
      },
      order: 0,
      isVisible: true,
    },
    {
      blockType: "TEXT",
      contentJson: {
        headline: "No Campaigns Yet",
        body: "Create your first campaign to get started.",
      },
      order: 1,
      isVisible: true,
    },
  ],
};

/**
 * Hydrates a single CMS page with default blocks if it has zero blocks.
 * 
 * @param pageSlug - The slug of the page to hydrate
 * @returns Promise<{ hydrated: boolean; blocksCreated: number }>
 */
export async function hydrateCmsPage(pageSlug: string): Promise<{ hydrated: boolean; blocksCreated: number }> {
  try {
    // Find the page
    const page = await prisma.page.findUnique({
      where: { slug: pageSlug },
      include: {
        _count: {
          select: { blocks: true },
        },
      },
    });

    if (!page) {
      console.warn(`[CMS Hydration] Page not found: ${pageSlug}`);
      return { hydrated: false, blocksCreated: 0 };
    }

    // Only hydrate if page has zero blocks (idempotent)
    if (page._count.blocks > 0) {
      console.log(`[CMS Hydration] Page ${pageSlug} already has ${page._count.blocks} blocks, skipping`);
      return { hydrated: false, blocksCreated: 0 };
    }

    // Get default blocks for this page
    const defaultBlocks = DEFAULT_PAGE_BLOCKS[pageSlug];
    if (!defaultBlocks || defaultBlocks.length === 0) {
      console.warn(`[CMS Hydration] No default blocks defined for page: ${pageSlug}`);
      return { hydrated: false, blocksCreated: 0 };
    }

    // Insert blocks
    const createdBlocks = await Promise.all(
      defaultBlocks.map((blockData) =>
        prisma.pageBlock.create({
          data: {
            pageId: page.id,
            blockType: blockData.blockType,
            contentJson: blockData.contentJson,
            order: blockData.order,
            isVisible: blockData.isVisible,
            createdBy: null, // System-created
          },
        })
      )
    );

    console.log(`[CMS Hydration] Hydrated ${pageSlug}: Created ${createdBlocks.length} blocks`);
    return { hydrated: true, blocksCreated: createdBlocks.length };
  } catch (error) {
    console.error(`[CMS Hydration] Error hydrating page ${pageSlug}:`, error);
    return { hydrated: false, blocksCreated: 0 };
  }
}

/**
 * Hydrates all CMS pages with default blocks.
 * Only hydrates pages that have zero blocks (idempotent).
 * 
 * @returns Promise<{ totalHydrated: number; totalBlocksCreated: number; results: Record<string, any> }>
 */
export async function hydrateAllCmsPages(): Promise<{
  totalHydrated: number;
  totalBlocksCreated: number;
  results: Record<string, any>;
}> {
  const pageSlugs = Object.keys(DEFAULT_PAGE_BLOCKS);
  let totalHydrated = 0;
  let totalBlocksCreated = 0;
  const results: Record<string, any> = {};

  console.log(`[CMS Hydration] Starting hydration for ${pageSlugs.length} pages...`);

  for (const slug of pageSlugs) {
    const result = await hydrateCmsPage(slug);
    results[slug] = result;
    if (result.hydrated) {
      totalHydrated++;
      totalBlocksCreated += result.blocksCreated;
    }
  }

  console.log(`[CMS Hydration] Complete: ${totalHydrated} pages hydrated, ${totalBlocksCreated} blocks created`);

  return {
    totalHydrated,
    totalBlocksCreated,
    results,
  };
}

