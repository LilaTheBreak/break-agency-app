/**
 * Create 5 Real Deals for Patricia Bright
 * 
 * Run with: npx ts-node scripts/createPatriciaDeals.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Simple ID generator that mimics createId
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

interface DealData {
  brandName: string;
  stage: "NEGOTIATION" | "CONTRACT_SIGNED" | "NEW_LEAD" | "LIVE" | "COMPLETED";
  scope: string;
  fee: number | null;
  agencyPercentage: number | null;
  expectedCloseDate: string; // ISO format: YYYY-MM-DD
  notes: string;
}

const DEALS: DealData[] = [
  {
    brandName: "Women Empowered Now (Dubai)",
    stage: "CONTRACT_SIGNED",
    scope: "Speaking appearance at women's empowerment event (Dubai)",
    fee: 5000,
    agencyPercentage: 15,
    expectedCloseDate: "2026-05-02",
    notes: "Speaker fee agreed at £5,000. Flights and logistics discussed. Status: Active / Contracted",
  },
  {
    brandName: "AVEENO",
    stage: "NEGOTIATION",
    scope: "2 × Instagram Reels, 2 × Instagram Story Sets (6 frames each)",
    fee: 125000,
    agencyPercentage: null,
    expectedCloseDate: "2026-02-28",
    notes: "Large-scale content partnership under discussion. Awaiting confirmation on scope and final sign-off",
  },
  {
    brandName: "Heart Radio & NatWest",
    stage: "CONTRACT_SIGNED",
    scope: "Audio content / radio campaign",
    fee: 3000,
    agencyPercentage: null,
    expectedCloseDate: "2026-01-06",
    notes: "Last-minute brief. £3k budget confirmed. Awaiting Patricia's final confirmation",
  },
  {
    brandName: "ACCA",
    stage: "NEGOTIATION",
    scope: "YouTube Shorts video, 1 × vertical video (≤ 1 minute)",
    fee: null,
    agencyPercentage: null,
    expectedCloseDate: "2026-02-15",
    notes: "Fee TBC. Awaiting brand proposal and budget confirmation",
  },
  {
    brandName: "Lenor (P&G)",
    stage: "NEGOTIATION",
    scope: "2 × TikTok videos, Creative treatment required",
    fee: null,
    agencyPercentage: null,
    expectedCloseDate: "2026-02-20",
    notes: "Early-stage discussions. Awaiting creative brief and commercial terms",
  },
];

async function main() {
  try {
    console.log("🚀 Starting Patricia Bright Deal Creation...\n");

    // Find Patricia Bright talent
    const patricia = await prisma.talent.findFirst({
      where: {
        name: {
          contains: "Patricia",
          mode: "insensitive",
        },
      },
    });

    if (!patricia) {
      console.error("❌ Patricia Bright not found in database");
      console.log("📝 Available talents:");
      const talents = await prisma.talent.findMany({
        select: { id: true, name: true },
        take: 10,
      });
      talents.forEach((t) => console.log(`   - ${t.name} (${t.id})`));
      process.exit(1);
    }

    console.log(`✅ Found Patricia Bright: ${patricia.id}\n`);

    // Find or create system user for deal creation
    let systemUser = await prisma.user.findFirst({
      where: {
        email: "system@thebreak.com",
      },
    });

    if (!systemUser) {
      console.log("Creating system user...");
      systemUser = await prisma.user.create({
        data: {
          id: generateId(),
          email: "system@thebreak.com",
          name: "System",
          role: "ADMIN",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    console.log(`✅ Using user: ${systemUser.id}\n`);

    // Create each deal
    let createdCount = 0;
    const createdDealIds: string[] = [];

    for (const dealData of DEALS) {
      try {
        console.log(`📝 Creating deal: ${dealData.brandName}`);

        // Get or create brand
        let brand = await prisma.brand.findFirst({
          where: {
            name: {
              contains: dealData.brandName,
              mode: "insensitive",
            },
          },
        });

        if (!brand) {
          console.log(`   Creating brand: ${dealData.brandName}`);
          brand = await prisma.brand.create({
            data: {
              id: generateId(),
              name: dealData.brandName,
              values: [],
              restrictedCategories: [],
              preferredCreatorTypes: [],
            },
          });
        }

        // Parse expected close date
        const expectedCloseParts = dealData.expectedCloseDate.split("-");
        const expectedClose = new Date(
          parseInt(expectedCloseParts[0]),
          parseInt(expectedCloseParts[1]) - 1,
          parseInt(expectedCloseParts[2])
        );

        // Build deal data
        const dealId = generateId();
        let dealNotes = dealData.notes;

        // Add fee TBC note if fee is null
        if (dealData.fee === null && !dealNotes.includes("TBC")) {
          dealNotes += " — Fee TBC";
        }

        // Extract platforms from scope
        const platforms: string[] = [];
        const scopeLower = dealData.scope.toLowerCase();
        if (scopeLower.includes("instagram")) platforms.push("INSTAGRAM");
        if (scopeLower.includes("tiktok")) platforms.push("TIKTOK");
        if (scopeLower.includes("youtube")) platforms.push("YOUTUBE");
        if (scopeLower.includes("snapchat")) platforms.push("SNAPCHAT");
        if (scopeLower.includes("audio") || scopeLower.includes("radio"))
          platforms.push("AUDIO");
        if (scopeLower.includes("speaking")) platforms.push("SPEAKING");
        if (scopeLower.includes("podcast")) platforms.push("PODCAST");

        // Create the deal
        const deal = await prisma.deal.create({
          data: {
            id: dealId,
            talentId: patricia.id,
            userId: systemUser.id,
            brandId: brand.id,
            brandName: dealData.brandName,
            campaignName: dealData.brandName,
            stage: dealData.stage,
            value: dealData.fee,
            currency: "GBP",
            expectedClose: expectedClose,
            notes: dealNotes,
            platforms: platforms.length > 0 ? platforms : [],
            deliverables: dealData.scope,
            startDate: new Date(),
            endDate: expectedClose,
            invoiceStatus: "NOT_INVOICED",
            paymentStatus: "UNPAID",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        console.log(`   ✅ Created deal: ${deal.id}`);
        console.log(
          `      Value: ${deal.value ? "£" + deal.value.toLocaleString() : "TBC"}`
        );
        console.log(`      Stage: ${deal.stage}`);
        console.log(`      Close Date: ${dealData.expectedCloseDate}\n`);

        createdDealIds.push(deal.id);
        createdCount++;
      } catch (error) {
        console.error(`   ❌ Failed to create deal:`, error);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`✅ Successfully created ${createdCount} of ${DEALS.length} deals`);
    console.log("=".repeat(60));
    console.log("\nCreated Deal IDs:");
    createdDealIds.forEach((id) => console.log(`  - ${id}`));

    // Verify deals were created
    const verifyDeals = await prisma.deal.findMany({
      where: { talentId: patricia.id },
      select: {
        id: true,
        brandName: true,
        stage: true,
        value: true,
        currency: true,
        expectedClose: true,
        notes: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    console.log("\n📊 Verification - Last 5 deals for Patricia:");
    verifyDeals.forEach((deal) => {
      console.log(`  - ${deal.brandName} (${deal.stage})`);
      console.log(
        `    Value: ${deal.value ? "£" + deal.value.toLocaleString() : "TBC"}`
      );
      console.log(`    Close: ${deal.expectedClose?.toISOString().split("T")[0]}`);
    });

    console.log("\n✨ Done!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

main();
