/**
 * CMS Pages Seed
 * Creates approved CMS pages for the block-based content management system
 * 
 * These pages are system-defined and locked:
 * - Cannot be deleted
 * - Cannot change slug
 * - Cannot change role scope
 * 
 * This seed is idempotent - safe to run multiple times
 * Only creates pages if they don't exist (by slug)
 */

import { PrismaClient, PageRoleScope } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Authoritative list of CMS-editable pages
 * These are the ONLY pages that should exist in the CMS
 */
const APPROVED_CMS_PAGES = [
  {
    slug: "welcome",
    title: "Welcome",
    roleScope: "PUBLIC" as PageRoleScope,
    isActive: true,
    description: "Logged-in welcome screen",
  },
  {
    slug: "creator-dashboard",
    title: "Creator Dashboard Intro",
    roleScope: "CREATOR" as PageRoleScope,
    isActive: true,
    description: "Top intro content only",
  },
  {
    slug: "founder-dashboard",
    title: "Founder Dashboard Intro",
    roleScope: "FOUNDER" as PageRoleScope,
    isActive: true,
    description: "Top intro content only",
  },
  {
    slug: "resources",
    title: "Resources Hub",
    roleScope: "PUBLIC" as PageRoleScope,
    isActive: true,
    description: "Static educational content",
  },
  {
    slug: "announcements",
    title: "Announcement Banner",
    roleScope: "PUBLIC" as PageRoleScope,
    isActive: true,
    description: "Global banner messaging",
  },
  {
    slug: "empty-states",
    title: "Empty States",
    roleScope: "PUBLIC" as PageRoleScope,
    isActive: true,
    description: "No deals / no campaigns copy",
  },
];

async function main() {
  console.log("🌱 Seeding approved CMS pages...");
  console.log(`   Creating ${APPROVED_CMS_PAGES.length} system-defined pages\n`);

  let created = 0;
  let skipped = 0;

  for (const pageData of APPROVED_CMS_PAGES) {
    // Check if page already exists
    const existing = await prisma.page.findUnique({
      where: { slug: pageData.slug },
    });

    if (existing) {
      console.log(`⏭️  ${pageData.slug}: Already exists (skipped)`);
      skipped++;
      continue;
    }

    // Only create if it doesn't exist (idempotent)
    const page = await prisma.page.create({
      data: {
        slug: pageData.slug,
        title: pageData.title,
        roleScope: pageData.roleScope,
        isActive: pageData.isActive,
      },
    });

    console.log(`✅ ${page.slug}: ${page.title} (${page.roleScope})`);
    created++;
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${APPROVED_CMS_PAGES.length}`);
  console.log(`\n✅ CMS pages seeding complete`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding CMS pages:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

