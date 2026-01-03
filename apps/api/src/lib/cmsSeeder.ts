/**
 * CMS Page Seeder
 * 
 * Ensures system-defined CMS pages exist in the database.
 * This function is idempotent and safe to run on every server boot.
 * 
 * Only creates pages if they don't exist (by slug).
 * Never overwrites existing content.
 */

import prisma from "./prisma.js";
import { PageRoleScope } from "@prisma/client";

/**
 * System-defined CMS pages that must always exist.
 * These are the ONLY pages approved for CMS editing.
 */
const SYSTEM_CMS_PAGES = [
  {
    slug: "welcome",
    title: "Welcome",
    roleScope: "PUBLIC" as PageRoleScope,
    description: "Logged-in welcome screen",
  },
  {
    slug: "creator-dashboard",
    title: "Creator Dashboard Intro",
    roleScope: "CREATOR" as PageRoleScope,
    description: "Top intro content only",
  },
  {
    slug: "founder-dashboard",
    title: "Founder Dashboard Intro",
    roleScope: "FOUNDER" as PageRoleScope,
    description: "Top intro content only",
  },
  {
    slug: "resources",
    title: "Resources Hub",
    roleScope: "PUBLIC" as PageRoleScope,
    description: "Static educational content",
  },
  {
    slug: "announcements",
    title: "Announcements",
    roleScope: "PUBLIC" as PageRoleScope,
    description: "Global banner messaging",
  },
  {
    slug: "empty-states",
    title: "Empty States",
    roleScope: "PUBLIC" as PageRoleScope,
    description: "No deals / no campaigns copy",
  },
];

/**
 * Ensures all system-defined CMS pages exist in the database.
 * This is idempotent - safe to run multiple times.
 * 
 * @returns Promise<{ created: number; skipped: number }>
 */
export async function ensureCmsPagesExist(): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  try {
    for (const pageData of SYSTEM_CMS_PAGES) {
      // Check if page already exists (by slug - unique constraint)
      const existing = await prisma.page.findUnique({
        where: { slug: pageData.slug },
      });

      if (existing) {
        // Page already exists - skip (idempotent)
        skipped++;
        continue;
      }

      // Create page only if it doesn't exist
      await prisma.page.create({
        data: {
          slug: pageData.slug,
          title: pageData.title,
          roleScope: pageData.roleScope,
          isActive: true,
        },
      });

      created++;
    }

    if (created > 0) {
      console.log(`[CMS] Seeded ${created} system pages (${skipped} already existed)`);
    } else if (skipped === SYSTEM_CMS_PAGES.length) {
      console.log(`[CMS] System pages verified (${skipped} pages exist)`);
    }
  } catch (error) {
    console.error("[CMS] Error ensuring CMS pages exist:", error);
    // Don't throw - allow server to continue even if seeding fails
    // This prevents server crashes in production if DB is temporarily unavailable
  }

  return { created, skipped };
}

