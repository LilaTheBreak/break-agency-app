/**
 * CMS Pages Seed
 * Creates default CMS pages for the block-based content management system
 * This seed is idempotent - safe to run multiple times
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_PAGES = [
  {
    slug: "welcome",
    title: "Welcome Page",
    roleScope: "PUBLIC",
    isActive: true,
  },
  {
    slug: "founder-dashboard",
    title: "Founder Dashboard Intro",
    roleScope: "FOUNDER",
    isActive: true,
  },
  {
    slug: "creator-dashboard",
    title: "Creator Dashboard Intro",
    roleScope: "CREATOR",
    isActive: true,
  },
  {
    slug: "admin-dashboard",
    title: "Admin Dashboard Intro",
    roleScope: "ADMIN",
    isActive: true,
  },
];

async function main() {
  console.log("🌱 Seeding CMS pages...");

  for (const pageData of DEFAULT_PAGES) {
    const page = await prisma.page.upsert({
      where: { slug: pageData.slug },
      update: {
        title: pageData.title,
        roleScope: pageData.roleScope,
        isActive: pageData.isActive,
      },
      create: pageData,
    });

    console.log(`✅ ${page.slug}: ${page.title} (${page.roleScope})`);
  }

  console.log(`\n✅ Seeded ${DEFAULT_PAGES.length} CMS pages`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding CMS pages:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

