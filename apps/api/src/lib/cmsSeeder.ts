/**
 * CMS Page Seeder
 * 
 * Ensures system-defined CMS pages exist in the database.
 * This function is idempotent and safe to run on every server boot.
 * 
 * Only creates pages if they don't exist (by slug).
 * Never overwrites existing content.
 */

import prisma from './prisma.js';
import { PageRoleScope } from "@prisma/client";

/**
 * System-defined CMS pages that must always exist.
 * These are the ONLY pages approved for CMS editing.
 * 
 * Note: Only PUBLIC pages in CMS_PUBLIC_PAGES registry are editable via CMS.
 * Dashboard pages (creator-dashboard, founder-dashboard) are NOT editable.
 */
const SYSTEM_CMS_PAGES = [
  {
    slug: "welcome",
    title: "Welcome",
    roleScope: "PUBLIC" as PageRoleScope,
    description: "Landing page",
  },
  {
    slug: "creator-dashboard",
    title: "Creator Dashboard Intro",
    roleScope: "CREATOR" as PageRoleScope,
    description: "Top intro content only (NOT editable via CMS)",
  },
  {
    slug: "founder-dashboard",
    title: "Founder Dashboard Intro",
    roleScope: "FOUNDER" as PageRoleScope,
    description: "Top intro content only (NOT editable via CMS)",
  },
  {
    slug: "resources",
    title: "Resources Hub",
    roleScope: "PUBLIC" as PageRoleScope,
    description: "Static educational content",
  },
  {
    slug: "careers",
    title: "Careers",
    roleScope: "PUBLIC" as PageRoleScope,
    description: "Careers page",
  },
  {
    slug: "press",
    title: "Press",
    roleScope: "PUBLIC" as PageRoleScope,
    description: "Press and media enquiries",
  },
  {
    slug: "help",
    title: "Help Center",
    roleScope: "PUBLIC" as PageRoleScope,
    description: "Help center and support",
  },
  {
    slug: "contact",
    title: "Contact",
    roleScope: "PUBLIC" as PageRoleScope,
    description: "Contact page",
  },
  {
    slug: "legal",
    title: "Legal + Privacy",
    roleScope: "PUBLIC" as PageRoleScope,
    description: "Legal and privacy information",
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    roleScope: "PUBLIC" as PageRoleScope,
    description: "Privacy policy",
  },
  {
    slug: "announcements",
    title: "Announcements",
    roleScope: "PUBLIC" as PageRoleScope,
    description: "Global banner messaging (NOT editable via CMS)",
  },
  {
    slug: "empty-states",
    title: "Empty States",
    roleScope: "PUBLIC" as PageRoleScope,
    description: "No deals / no campaigns copy (NOT editable via CMS)",
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

