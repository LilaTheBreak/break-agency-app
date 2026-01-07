/**
 * Patricia Bright Deal Ingestion Script
 * 
 * Purpose: Import real brand deals for Patricia Bright talent profile
 * from source of truth (deal tracker spreadsheet)
 * 
 * Usage:
 *   npx ts-node scripts/ingestPatriciaDeals.ts
 * 
 * Requirements:
 *   - Patricia Bright must exist as a talent
 *   - Brands must exist in the database
 *   - All deal fields properly mapped
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================================
// DATA: Patricia Bright's Deal Tracker
// Source of Truth - UPDATE WITH ACTUAL DATA FROM SPREADSHEET
// ============================================================================

interface DealInput {
  brandName: string;
  campaignName: string;
  dealType: "Paid Partnership" | "Ambassador" | "Affiliate" | "Gifting" | "Content License";
  platform: string[]; // ["Instagram", "TikTok", etc]
  deliverables: string[]; // ["1 Post", "3 Reels", "Stories", "Lives", "Usage Rights"]
  dealValue: number; // GBP (store as integer pennies in DB)
  status: "Draft" | "Active" | "Completed" | "Cancelled";
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (nullable if ongoing)
  invoiceStatus: "Not Invoiced" | "Invoiced" | "Paid";
  notes?: string;
}

// PLACEHOLDER: Replace with actual data from Patricia's tracker
const PATRICIA_DEALS: DealInput[] = [
  {
    brandName: "Brand A",
    campaignName: "Campaign 2024",
    dealType: "Paid Partnership",
    platform: ["Instagram", "TikTok"],
    deliverables: ["1 Post", "3 Reels", "Usage Rights"],
    dealValue: 5000, // GBP
    status: "Active",
    startDate: "2024-01-15",
    endDate: "2024-06-30",
    invoiceStatus: "Invoiced",
    notes: "Ongoing collaboration"
  },
  {
    brandName: "Brand B",
    campaignName: "Q1 Influencer Campaign",
    dealType: "Ambassador",
    platform: ["Instagram"],
    deliverables: ["2 Posts", "1 Reel", "2 Stories", "Usage Rights"],
    dealValue: 8000,
    status: "Completed",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    invoiceStatus: "Paid",
    notes: "High engagement rates achieved"
  },
  {
    brandName: "Brand C",
    campaignName: "Summer Collab",
    dealType: "Gifting",
    platform: ["TikTok", "YouTube"],
    deliverables: ["Content to be created"],
    dealValue: 2500,
    status: "Draft",
    startDate: "2024-06-01",
    endDate: null,
    invoiceStatus: "Not Invoiced",
    notes: "Pending contract signature"
  }
];

// ============================================================================
// FUNCTIONS
// ============================================================================

async function findOrCreatePatricia() {
  console.log("🔍 Finding Patricia Bright...");
  
  // Search by name in Talent table
  let patricia = await prisma.talent.findFirst({
    where: {
      name: {
        contains: "Patricia",
        mode: "insensitive"
      }
    }
  });
  
  if (patricia) {
    console.log(`✅ Found Patricia: ${patricia.id}`);
    return patricia;
  }
  
  console.log("❌ Patricia not found");
  console.log("Please create Patricia Bright as a talent first:");
  console.log("  1. Go to Admin → Talents");
  console.log("  2. Create new talent 'Patricia Bright'");
  console.log("  3. Then run this script again");
  
  process.exit(1);
}

async function findOrCreateBrand(brandName: string) {
  console.log(`🔍 Finding/creating brand: ${brandName}`);
  
  let brand = await prisma.brand.findFirst({
    where: {
      name: {
        contains: brandName,
        mode: "insensitive"
      }
    }
  });
  
  if (brand) {
    console.log(`  ✅ Found: ${brand.id}`);
    return brand;
  }
  
  console.log(`  ➕ Creating brand: ${brandName}`);
  brand = await prisma.brand.create({
    data: {
      id: `brand_${Date.now()}`,
      name: brandName,
      slug: brandName.toLowerCase().replace(/\s+/g, "-")
    }
  });
  
  console.log(`  ✅ Created: ${brand.id}`);
  return brand;
}

function mapDealStatus(status: DealInput["status"]) {
  const statusMap: Record<DealInput["status"], string> = {
    "Draft": "NEW_LEAD",
    "Active": "DELIVERABLES_IN_PROGRESS",
    "Completed": "COMPLETED",
    "Cancelled": "LOST"
  };
  return statusMap[status];
}

async function dealExists(talentId: string, brandId: string, startDate: Date) {
  return prisma.deal.findFirst({
    where: {
      talentId,
      brandId,
      createdAt: {
        gte: new Date(startDate.getTime() - 86400000), // ±1 day
        lte: new Date(startDate.getTime() + 86400000)
      }
    }
  });
}

async function ingestDeal(
  deal: DealInput,
  patricia: any,
  brand: any,
  adminUserId: string
) {
  console.log(`\n📝 Ingesting deal: ${deal.brandName} - ${deal.campaignName}`);
  
  const startDate = new Date(deal.startDate);
  const endDate = deal.endDate ? new Date(deal.endDate) : null;
  
  // Check for duplicates (idempotent)
  const existing = await dealExists(patricia.id, brand.id, startDate);
  if (existing) {
    console.log(`  ⏭️  Deal already exists (${existing.id}), skipping`);
    return existing;
  }
  
  const dealData = {
    id: `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: adminUserId,
    talentId: patricia.id,
    brandId: brand.id,
    brandName: deal.brandName,
    stage: mapDealStatus(deal.status),
    value: deal.dealValue,
    currency: "GBP",
    expectedClose: endDate,
    campaignLiveAt: deal.status === "Active" ? startDate : null,
    contractSignedAt: deal.status !== "Draft" ? startDate : null,
    closedAt: deal.status === "Completed" ? endDate : null,
    deliverablesCompletedAt: deal.status === "Completed" ? endDate : null,
    aiSummary: `${deal.dealType}: ${deal.platform.join(", ")} - ${deal.deliverables.join(", ")}`,
    notes: deal.notes || null,
    createdAt: startDate,
    updatedAt: startDate
  };
  
  const created = await prisma.deal.create({
    data: dealData
  });
  
  console.log(`  ✅ Created deal: ${created.id}`);
  console.log(`     Value: £${(deal.dealValue / 100).toFixed(2)}`);
  console.log(`     Status: ${deal.status}`);
  console.log(`     Platforms: ${deal.platform.join(", ")}`);
  console.log(`     Deliverables: ${deal.deliverables.join(", ")}`);
  
  return created;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("Patricia Bright Deal Ingestion");
  console.log("=".repeat(70) + "\n");
  
  try {
    // Get admin user (fallback to first superadmin)
    const adminUser = await prisma.user.findFirst({
      where: {
        role: {
          in: ["SUPERADMIN", "ADMIN"]
        }
      }
    });
    
    if (!adminUser) {
      console.error("❌ No admin user found");
      process.exit(1);
    }
    
    console.log(`📌 Using admin user: ${adminUser.email}\n`);
    
    // Find Patricia
    const patricia = await findOrCreatePatricia();
    console.log();
    
    // Ingest each deal
    let created = 0;
    let skipped = 0;
    
    for (const dealInput of PATRICIA_DEALS) {
      const brand = await findOrCreateBrand(dealInput.brandName);
      const deal = await ingestDeal(dealInput, patricia, brand, adminUser.id);
      
      if (deal) {
        created++;
      } else {
        skipped++;
      }
    }
    
    // Summary
    console.log("\n" + "=".repeat(70));
    console.log("Summary");
    console.log("=".repeat(70));
    console.log(`✅ Created: ${created} deals`);
    console.log(`⏭️  Skipped: ${skipped} deals (already exist)`);
    console.log(`💰 Total value: £${PATRICIA_DEALS.reduce((sum, d) => sum + d.dealValue, 0) / 100}`);
    console.log("\n✨ Patricia's profile is now updated with real deal data!\n");
    
  } catch (error) {
    console.error("\n❌ Error during ingestion:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
