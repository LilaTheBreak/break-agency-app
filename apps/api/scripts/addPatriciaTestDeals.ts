#!/usr/bin/env node
/**
 * Quick Patricia Deal Test Script
 * 
 * This script adds test deals directly to Patricia Bright's account
 * for development/testing purposes.
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." npm run test:patricia-deals
 *   or
 *   DATABASE_URL="postgresql://..." tsx scripts/addPatriciaTestDeals.ts
 */

import { PrismaClient } from "@prisma/client";

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  console.error("Usage: DATABASE_URL='postgresql://...' npm run test:patricia-deals");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔍 Finding Patricia Bright...");
    
    // Find Patricia by name
    const patricia = await prisma.talent.findFirst({
      where: {
        name: {
          contains: "Patricia",
          mode: "insensitive"
        }
      }
    });
    
    if (!patricia) {
      console.log("❌ Patricia Bright not found in database");
      console.log("Please create Patricia as a talent first via the admin panel");
      process.exit(1);
    }
    
    console.log(`✅ Found Patricia: ${patricia.name} (${patricia.id})`);
    
    // Create test brands
    console.log("\n📦 Creating brands...");
    
    const brands = await Promise.all([
      prisma.brand.findFirst({ where: { name: { contains: "Nike", mode: "insensitive" } } })
        .then(b => b || prisma.brand.create({
          data: { id: `brand_nike_${Date.now()}`, name: "Nike", slug: "nike" }
        })),
      prisma.brand.findFirst({ where: { name: { contains: "Adidas", mode: "insensitive" } } })
        .then(b => b || prisma.brand.create({
          data: { id: `brand_adidas_${Date.now()}`, name: "Adidas", slug: "adidas" }
        })),
      prisma.brand.findFirst({ where: { name: { contains: "Glossier", mode: "insensitive" } } })
        .then(b => b || prisma.brand.create({
          data: { id: `brand_glossier_${Date.now()}`, name: "Glossier", slug: "glossier" }
        }))
    ]);
    
    console.log(`✅ Brands ready: ${brands.map(b => b.name).join(", ")}`);
    
    // Create deals
    console.log("\n💰 Creating deals for Patricia...");
    
    const deals = await Promise.all([
      prisma.deal.create({
        data: {
          id: `deal_nike_${Date.now()}`,
          talentId: patricia.id,
          brandId: brands[0].id,
          brandName: brands[0].name,
          stage: "DELIVERABLES_IN_PROGRESS",
          value: 1250000, // 12,500 GBP in pence
          currency: "GBP",
          expectedClose: new Date("2024-08-31"),
          notes: "Q2-Q3 collaboration with high engagement targets",
          aiSummary: "Spring Athletic Collection - 2 Posts, 3 Reels, 2 Stories with usage rights"
        }
      }),
      prisma.deal.create({
        data: {
          id: `deal_adidas_${Date.now()}`,
          talentId: patricia.id,
          brandId: brands[1].id,
          brandName: brands[1].name,
          stage: "DELIVERABLES_IN_PROGRESS",
          value: 980000, // 9,800 GBP in pence
          currency: "GBP",
          expectedClose: new Date("2024-09-30"),
          notes: "Ambassador role for summer athletic wear line",
          aiSummary: "Summer Campaign - 1 Long-form Video, 4 Posts, 3 Reels with usage rights"
        }
      }),
      prisma.deal.create({
        data: {
          id: `deal_glossier_${Date.now()}`,
          talentId: patricia.id,
          brandId: brands[2].id,
          brandName: brands[2].name,
          stage: "COMPLETED",
          value: 750000, // 7,500 GBP in pence
          currency: "GBP",
          expectedClose: new Date("2024-03-31"),
          notes: "Q1 beauty partnership - exceeded engagement benchmarks",
          aiSummary: "Beauty Influencer Partnership - 3 Posts, 5 Reels, Stories & long-form content"
        }
      })
    ]);
    
    console.log(`✅ Created ${deals.length} deals:`);
    deals.forEach((deal, i) => {
      const value = (deal.value / 100).toFixed(2);
      console.log(`  ${i + 1}. ${deal.brandName}: £${value} (${deal.stage})`);
    });
    
    // Verify deals
    console.log("\n✔️  Verifying deals...");
    const patrickiaWithDeals = await prisma.talent.findUnique({
      where: { id: patricia.id },
      include: { Deal: true }
    });
    
    console.log(`✅ Patricia now has ${patrickiaWithDeals?.Deal.length || 0} deals`);
    
    // Calculate totals
    const allDeals = patrickiaWithDeals?.Deal || [];
    const pipelineValue = allDeals
      .filter(d => !["COMPLETED", "LOST", "PAYMENT_RECEIVED"].includes(d.stage))
      .reduce((sum, d) => sum + (d.value || 0), 0);
    
    const confirmedRevenue = allDeals
      .filter(d => ["CONTRACT_SIGNED", "DELIVERABLES_IN_PROGRESS", "PAYMENT_PENDING"].includes(d.stage))
      .reduce((sum, d) => sum + (d.value || 0), 0);
    
    const completed = allDeals
      .filter(d => ["COMPLETED", "PAYMENT_RECEIVED"].includes(d.stage))
      .reduce((sum, d) => sum + (d.value || 0), 0);
    
    console.log(`
Pipeline Value: £${(pipelineValue / 100).toFixed(2)}
Confirmed Revenue: £${(confirmedRevenue / 100).toFixed(2)}
Completed: £${(completed / 100).toFixed(2)}
    `);
    
    console.log("✨ Done! Patricia's deals have been created.");
    console.log("   Refresh the Patricia Bright talent page to see the deals.");
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
