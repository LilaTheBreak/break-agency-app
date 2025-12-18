/**
 * Phase 1 Test Data Seed
 * Creates minimal test data to verify campaign and deal flows work end-to-end
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Phase 1 test data...");

  // 1. Create test users if they don't exist
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@thebreak.co" },
    update: {},
    create: {
      id: "user_admin_phase1",
      email: "admin@thebreak.co",
      name: "Admin User",
      role: "ADMIN",
      onboarding_status: "approved",
    },
  });

  const brandUser = await prisma.user.upsert({
    where: { email: "brand@test.com" },
    update: {},
    create: {
      id: "user_brand_phase1",
      email: "brand@test.com",
      name: "Test Brand User",
      role: "BRAND",
      onboarding_status: "approved",
    },
  });

  const creatorUser = await prisma.user.upsert({
    where: { email: "creator@test.com" },
    update: {},
    create: {
      id: "user_creator_phase1",
      email: "creator@test.com",
      name: "Test Creator",
      role: "CREATOR",
      onboarding_status: "approved",
    },
  });

  console.log("✅ Created/verified users:", {
    admin: adminUser.email,
    brand: brandUser.email,
    creator: creatorUser.email,
  });

  // 2. Create test talent profile
  const talent = await prisma.talent.upsert({
    where: { id: creatorUser.id },
    update: {},
    create: {
      id: creatorUser.id,
      userId: creatorUser.id,
      name: creatorUser.name || "Test Creator",
      categories: ["Lifestyle", "Wellness", "Tech"],
      stage: "ACTIVE",
    },
  });

  console.log("✅ Created talent profile:", talent.name);

  // 3. Create test brand
  const brand = await prisma.brand.upsert({
    where: { name: "Test Brand Co" },
    update: {},
    create: {
      id: brandUser.id,
      name: "Test Brand Co",
      values: ["Innovation", "Quality", "Sustainability"],
      restrictedCategories: [],
      preferredCreatorTypes: ["Lifestyle", "Tech"],
      targetAudience: {
        demographics: "25-40 years old",
        interests: ["Technology", "Wellness"],
      },
    },
  });

  console.log("✅ Created brand:", brand.name);

  // 4. Create test deal
  const deal = await prisma.deal.create({
    data: {
      id: `deal_phase1_${Date.now()}`,
      userId: adminUser.id,
      talentId: talent.id,
      brandId: brand.id,
      stage: "NEGOTIATION",
      value: 5000,
      currency: "USD",
      brandName: brand.name,
      aiSummary: "Test deal for Phase 1 verification - creator collaboration",
      notes: "Created by Phase 1 seed script",
      expectedClose: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      updatedAt: new Date(),
    },
  });

  console.log("✅ Created deal:", deal.id);

  // 5. Create test BrandCampaign
  const brandCampaign = await prisma.brandCampaign.create({
    data: {
      id: `campaign_brand_${Date.now()}`,
      title: "Q1 2025 Lifestyle Campaign",
      ownerId: adminUser.id,
      stage: "ACTIVE",
      brands: [
        {
          id: brand.id,
          name: brand.name,
          email: brandUser.email,
          reach: 50000,
          revenue: 25000,
        },
      ],
      creatorTeams: [
        {
          creatorId: talent.id,
          name: talent.name,
          status: "active",
        },
      ],
      metadata: {
        description: "Test brand campaign for Phase 1",
        targetAudience: "Tech-savvy millennials",
      },
    },
  });

  console.log("✅ Created BrandCampaign:", brandCampaign.title);

  // 6. Create CampaignBrandPivot link
  const pivot = await prisma.campaignBrandPivot.create({
    data: {
      campaignId: brandCampaign.id,
      brandId: brand.id,
      metrics: {
        reach: 50000,
        revenue: 25000,
        pacing: 85,
        opportunities: ["collaboration", "sponsored-content"],
        matches: [talent.id],
      },
    },
  });

  console.log("✅ Created campaign-brand link");

  // 7. Create test CrmCampaign
  const crmCampaign = await prisma.crmCampaign.create({
    data: {
      id: `crm_campaign_${Date.now()}`,
      campaignName: "Product Launch Campaign 2025",
      brandId: brand.id,
      campaignType: "Product Launch",
      status: "Active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      internalSummary: "Major product launch with creator partnerships",
      goals: "Generate 100K impressions, 5K engagements",
      keyNotes: "High priority - Q1 strategic initiative",
      owner: adminUser.email,
      linkedDealIds: [deal.id],
      linkedTalentIds: [talent.id],
      activity: [
        {
          at: new Date().toISOString(),
          label: "Campaign created",
        },
      ],
      lastActivityAt: new Date(),
    },
  });

  console.log("✅ Created CrmCampaign:", crmCampaign.campaignName);

  console.log("\n🎉 Phase 1 test data seeded successfully!");
  console.log("\nTest Data Summary:");
  console.log("- Users: 3 (admin, brand, creator)");
  console.log("- Talent: 1");
  console.log("- Brands: 1");
  console.log("- Deals: 1");
  console.log("- BrandCampaigns: 1");
  console.log("- CrmCampaigns: 1");
  console.log("- Campaign-Brand Links: 1");
  console.log("\n✨ Campaign models successfully added to database!");
  console.log("The API routes /api/campaigns and /api/crm-campaigns should now work.");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
