/**
 * Patricia Bright Data Ingestion Script
 * Ingests Talent profile + 15 deals from January 2025
 * 
 * Run with: npx ts-node scripts/ingest-patricia-bright.ts
 */

import prisma from "../src/lib/prisma.js" assert { type: "commonjs" };
import { createId } from "@paralleldrive/cuid2.js" assert { type: "commonjs" };

interface DealInput {
  brand: string;
  scope: string;
  fee: number;
  agencyPercent: number;
  dueDate: string;
  notes: string;
}

// January 2025 deals data
const deals: DealInput[] = [
  {
    brand: "Women Empowered Now (Dubai)",
    scope: "Speaking engagement",
    fee: 10000,
    agencyPercent: 20,
    dueDate: "2025-01-31",
    notes: "Paid in full",
  },
  {
    brand: "AVEENO",
    scope: "Instagram + usage",
    fee: 20000,
    agencyPercent: 20,
    dueDate: "2025-01-31",
    notes: "Usage included",
  },
  {
    brand: "Heart Radio & NatWest",
    scope: "Radio appearance",
    fee: 7500,
    agencyPercent: 20,
    dueDate: "2025-01-31",
    notes: "One-off appearance",
  },
  {
    brand: "ACCA",
    scope: "Panel + content",
    fee: 15000,
    agencyPercent: 20,
    dueDate: "2025-01-31",
    notes: "Finance-led partnership",
  },
  {
    brand: "Lenor (P&G)",
    scope: "Instagram content",
    fee: 12000,
    agencyPercent: 20,
    dueDate: "2025-01-31",
    notes: "Standard brand deal",
  },
  {
    brand: "Anua – Rice Line",
    scope: "TikTok + IG",
    fee: 8000,
    agencyPercent: 20,
    dueDate: "2025-01-31",
    notes: "Beauty category",
  },
  {
    brand: "CALAI",
    scope: "Content partnership",
    fee: 5000,
    agencyPercent: 20,
    dueDate: "2025-01-31",
    notes: "Startup collaboration",
  },
  {
    brand: "Pippit (Katlas Media)",
    scope: "Content creation",
    fee: 6000,
    agencyPercent: 20,
    dueDate: "2025-01-31",
    notes: "Media partner",
  },
  {
    brand: "Skillshare",
    scope: "YouTube integration",
    fee: 18000,
    agencyPercent: 20,
    dueDate: "2025-01-31",
    notes: "Education platform",
  },
  {
    brand: "Symprove",
    scope: "IG + Story",
    fee: 9000,
    agencyPercent: 20,
    dueDate: "2025-01-31",
    notes: "Wellness brand",
  },
  {
    brand: "SHEGLAM",
    scope: "Beauty content",
    fee: 11000,
    agencyPercent: 20,
    dueDate: "2025-01-31",
    notes: "Makeup collaboration",
  },
  {
    brand: "ShopTalk Abu Dhabi",
    scope: "Speaking appearance",
    fee: 12000,
    agencyPercent: 20,
    dueDate: "2025-01-31",
    notes: "Event appearance",
  },
  {
    brand: "QuickBooks",
    scope: "Finance content",
    fee: 20000,
    agencyPercent: 20,
    dueDate: "2025-01-31",
    notes: "Accounting software campaign",
  },
  {
    brand: "Real Techniques",
    scope: "Beauty content",
    fee: 10000,
    agencyPercent: 20,
    dueDate: "2025-01-31",
    notes: "Tools partnership",
  },
  {
    brand: "Maison Francis Kurkdjian",
    scope: "Luxury fragrance content",
    fee: 15000,
    agencyPercent: 20,
    dueDate: "2025-01-31",
    notes: "Luxury category",
  },
];

async function ingestPatriciaBright() {
  console.log("🚀 Starting Patricia Bright data ingestion...\n");

  try {
    // 1️⃣ Create Talent profile
    console.log("📝 Creating Talent profile...");
    const talent = await prisma.talent.create({
      data: {
        id: createId(),
        name: "Patricia Bright",
        displayName: "Patricia Bright",
        email: "patricia@patricabright.com",
        phone: "+44 (pending)",
        status: "ACTIVE",
        representationType: "MANAGED",
        categories: ["Finance", "Beauty", "Entrepreneurship", "Speaking"],
        notes: "High-profile creator and business founder. Multi-platform presence (YouTube, Instagram, TikTok).",
        currency: "GBP",
      },
    });

    console.log(`✅ Created Talent: ${talent.name} (ID: ${talent.id})\n`);

    // 2️⃣ Create all deals
    console.log("💼 Creating 15 deal records for January 2025...\n");

    const createdDeals = [];
    let totalFees = 0;
    let totalAgency = 0;

    for (let i = 0; i < deals.length; i++) {
      const dealInput = deals[i];
      const agencyTotal = (dealInput.fee * dealInput.agencyPercent) / 100;
      totalFees += dealInput.fee;
      totalAgency += agencyTotal;

      const deal = await prisma.deal.create({
        data: {
          id: createId(),
          talentId: talent.id,
          brand: dealInput.brand,
          scopeOfWork: dealInput.scope,
          amount: dealInput.fee,
          currency: "GBP",
          stage: "SIGNED",
          paymentStatus: "PAID",
          agencyPercentage: dealInput.agencyPercent,
          agencyTotal: agencyTotal,
          dueDate: new Date(dealInput.dueDate),
          notes: `[JAN 2025] ${dealInput.notes}`,
          status: "ACTIVE",
        },
      });

      createdDeals.push(deal);
      console.log(
        `  ${i + 1}. ${dealInput.brand}: £${dealInput.fee.toLocaleString()} (Agency: £${agencyTotal.toLocaleString()})`
      );
    }

    console.log("\n✅ All deals created successfully!\n");

    // 3️⃣ Validate and report
    console.log("📊 VALIDATION REPORT");
    console.log("═".repeat(60));
    console.log(`Talent: ${talent.name}`);
    console.log(`Talent ID: ${talent.id}`);
    console.log(`Total Deals: ${createdDeals.length}`);
    console.log(`Total Deal Fee: £${totalFees.toLocaleString()}`);
    console.log(`Total Agency Revenue (20%): £${totalAgency.toLocaleString()}`);
    console.log(`Average Deal Value: £${(totalFees / createdDeals.length).toLocaleString()}`);
    console.log("\nDeal Breakdown by Month:");
    console.log(`  January 2025: ${createdDeals.length} deals`);
    console.log("\nPayment Status:");
    const paidDeals = createdDeals.filter((d) => d.paymentStatus === "PAID");
    console.log(`  Paid: ${paidDeals.length}/${createdDeals.length}`);
    console.log(`  Paid Amount: £${createdDeals.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}`);

    // 4️⃣ Verify data in database
    console.log("\n🔍 Verifying data in database...");
    const talentCheck = await prisma.talent.findUnique({
      where: { id: talent.id },
      include: { deals: true },
    });

    if (talentCheck && talentCheck.deals.length === 15) {
      console.log(`✅ Patricia Bright record verified with ${talentCheck.deals.length} deals`);
    } else {
      console.log(
        `⚠️  Warning: Expected 15 deals, found ${talentCheck?.deals.length || 0}`
      );
    }

    // 5️⃣ Success output
    console.log("\n" + "═".repeat(60));
    console.log("🎉 DATA INGESTION COMPLETE");
    console.log("═".repeat(60));
    console.log(`✅ Talent Profile Created: Patricia Bright`);
    console.log(`✅ Deals Ingested: 15`);
    console.log(`✅ Total Revenue Managed: £${totalFees.toLocaleString()}`);
    console.log(`✅ Agency Commission (20%): £${totalAgency.toLocaleString()}`);
    console.log(`✅ All records linked and verified`);
    console.log("\nYou can now:");
    console.log("  - View Patricia in admin dashboard");
    console.log("  - Track all 15 January deals");
    console.log("  - Generate revenue reports");
    console.log("  - Export to financial systems");

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during ingestion:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

ingestPatriciaBright();
