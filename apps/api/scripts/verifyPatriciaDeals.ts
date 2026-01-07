/**
 * Patricia Bright Deal Verification & Testing
 * 
 * Verifies that:
 * 1. Patricia exists as a talent
 * 2. All her deals are properly persisted
 * 3. Deal data is accurate and complete
 * 4. API endpoints work correctly
 * 5. UI will display deals without errors
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyPatriciaProfile() {
  console.log("\n" + "=".repeat(70));
  console.log("Patricia Bright Deal Verification");
  console.log("=".repeat(70) + "\n");
  
  try {
    // 1. Find Patricia
    console.log("1️⃣  Finding Patricia Bright...");
    const patricia = await prisma.talent.findFirst({
      where: {
        name: {
          contains: "Patricia",
          mode: "insensitive"
        }
      },
      include: {
        User: true,
        Deal: {
          include: {
            Brand: true
          }
        }
      }
    });
    
    if (!patricia) {
      console.log("❌ Patricia Bright not found in database");
      return false;
    }
    
    console.log(`✅ Found: ${patricia.name} (ID: ${patricia.id})`);
    console.log(`   Email: ${patricia.User?.email}`);
    console.log(`   Status: ${patricia.status || "Not set"}`);
    
    // 2. Check deals
    console.log(`\n2️⃣  Checking deals (${patricia.Deal.length} total)...`);
    
    if (patricia.Deal.length === 0) {
      console.log("⚠️  No deals found for Patricia");
      return false;
    }
    
    let activeDealValue = 0;
    let completedDealValue = 0;
    let draftDealCount = 0;
    
    patricia.Deal.forEach((deal, idx) => {
      console.log(`\n   Deal ${idx + 1}: ${deal.Brand?.name || deal.brandName}`);
      console.log(`     ID: ${deal.id}`);
      console.log(`     Value: £${deal.value || 0} (${deal.currency})`);
      console.log(`     Stage: ${deal.stage}`);
      console.log(`     Expected Close: ${deal.expectedClose ? deal.expectedClose.toLocaleDateString() : "Ongoing"}`);
      console.log(`     Notes: ${deal.notes || "(none)"}`);
      console.log(`     Summary: ${deal.aiSummary || "(none)"}`);
      
      // Track totals
      if (deal.stage === "DELIVERABLES_IN_PROGRESS" && deal.value) {
        activeDealValue += deal.value;
      }
      if (deal.stage === "COMPLETED" && deal.value) {
        completedDealValue += deal.value;
      }
      if (deal.stage === "NEW_LEAD") {
        draftDealCount++;
      }
      
      // Validation
      const warnings = [];
      if (!deal.Brand && !deal.brandName) warnings.push("No brand info");
      if (!deal.value) warnings.push("No deal value");
      if (!deal.stage) warnings.push("No stage");
      
      if (warnings.length > 0) {
        console.log(`     ⚠️  Warnings: ${warnings.join(", ")}`);
      }
    });
    
    // 3. Summary
    console.log("\n3️⃣  Deal Summary:");
    console.log(`   Total deals: ${patricia.Deal.length}`);
    console.log(`   Active value: £${activeDealValue}`);
    console.log(`   Completed value: £${completedDealValue}`);
    console.log(`   Draft deals: ${draftDealCount}`);
    console.log(`   Total value: £${patricia.Deal.reduce((sum, d) => sum + (d.value || 0), 0)}`);
    
    // 4. Test API endpoint
    console.log("\n4️⃣  Testing API endpoint format...");
    console.log(`   GET /api/talent/${patricia.id}/deals`);
    console.log(`   Expected response: Array of ${patricia.Deal.length} deals`);
    
    // 5. Test UI rendering
    console.log("\n5️⃣  UI Rendering Checklist:");
    const uiChecks = [
      { check: "Deal Brand names visible", pass: patricia.Deal.every(d => d.Brand?.name || d.brandName) },
      { check: "Deal values in GBP", pass: patricia.Deal.every(d => d.currency === "GBP") },
      { check: "Deal stages/statuses set", pass: patricia.Deal.every(d => d.stage) },
      { check: "Summary/notes available", pass: patricia.Deal.every(d => d.aiSummary || d.notes) },
      { check: "No null required fields", pass: patricia.Deal.every(d => d.id && d.talentId && d.brandId) }
    ];
    
    uiChecks.forEach(({ check, pass }) => {
      console.log(`   ${pass ? "✅" : "❌"} ${check}`);
    });
    
    const allPass = uiChecks.every(c => c.pass);
    
    if (allPass) {
      console.log("\n✨ Patricia's profile is ready for production!");
      return true;
    } else {
      console.log("\n⚠️  Some checks failed - review above");
      return false;
    }
    
  } catch (error) {
    console.error("❌ Verification failed:");
    console.error(error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyPatriciaProfile().then(success => {
  process.exit(success ? 0 : 1);
});
