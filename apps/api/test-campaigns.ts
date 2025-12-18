/**
 * Test script to verify campaign models work
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testCampaigns() {
  console.log("🧪 Testing Campaign Models...\n");

  try {
    // Test 1: Fetch BrandCampaigns
    console.log("1️⃣ Testing BrandCampaign.findMany()");
    const brandCampaigns = await prisma.brandCampaign.findMany({
      include: {
        brandLinks: true,
        Owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
    console.log(`✅ Found ${brandCampaigns.length} BrandCampaign(s)`);
    if (brandCampaigns.length > 0) {
      console.log("   First campaign:", {
        id: brandCampaigns[0].id,
        title: brandCampaigns[0].title,
        stage: brandCampaigns[0].stage,
        owner: brandCampaigns[0].Owner.email,
        brandLinks: brandCampaigns[0].brandLinks.length,
      });
    }

    // Test 2: Fetch CrmCampaigns
    console.log("\n2️⃣ Testing CrmCampaign.findMany()");
    const crmCampaigns = await prisma.crmCampaign.findMany({
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    console.log(`✅ Found ${crmCampaigns.length} CrmCampaign(s)`);
    if (crmCampaigns.length > 0) {
      console.log("   First campaign:", {
        id: crmCampaigns[0].id,
        name: crmCampaigns[0].campaignName,
        status: crmCampaigns[0].status,
        brand: crmCampaigns[0].Brand.name,
        type: crmCampaigns[0].campaignType,
      });
    }

    // Test 3: Fetch CampaignBrandPivots
    console.log("\n3️⃣ Testing CampaignBrandPivot.findMany()");
    const pivots = await prisma.campaignBrandPivot.findMany();
    console.log(`✅ Found ${pivots.length} CampaignBrandPivot(s)`);
    if (pivots.length > 0) {
      console.log("   First pivot:", {
        id: pivots[0].id,
        campaignId: pivots[0].campaignId,
        brandId: pivots[0].brandId,
        hasMetrics: !!pivots[0].metrics,
      });
    }

    // Test 4: Create a new BrandCampaign
    console.log("\n4️⃣ Testing BrandCampaign.create()");
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length > 0) {
      const testCampaign = await prisma.brandCampaign.create({
        data: {
          title: `Test Campaign ${Date.now()}`,
          ownerId: users[0].id,
          stage: "PLANNING",
          metadata: {
            test: true,
            createdBy: "test script",
          },
        },
      });
      console.log(`✅ Created test BrandCampaign: ${testCampaign.id}`);

      // Clean up test campaign
      await prisma.brandCampaign.delete({
        where: { id: testCampaign.id },
      });
      console.log(`✅ Cleaned up test campaign`);
    }

    console.log("\n🎉 All campaign model tests passed!");
    console.log("\n✨ Campaign models are working correctly!");
    console.log("   - BrandCampaign ✓");
    console.log("   - CrmCampaign ✓");
    console.log("   - CampaignBrandPivot ✓");
    console.log("\n📝 API routes /api/campaigns and /api/crm-campaigns should now function properly.");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testCampaigns()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
