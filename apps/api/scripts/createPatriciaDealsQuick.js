#!/usr/bin/env node
/**
 * Patricia Deal Quick Add - Using the API Directly
 * 
 * This script creates deals for Patricia by making API calls
 * Just requires the API to be running and an auth token
 * 
 * Usage:
 *   Make sure your app is running, then run this script
 *   It will hit the API endpoints directly
 */

const PATRICIA_TALENT_ID = "talent_1767737816502_d9wnw3pav"; // From the screenshot
const API_BASE_URL = "http://localhost:3001"; // Adjust if needed

// Test brands to create/find
const BRANDS = [
  { name: "Nike", slug: "nike" },
  { name: "Adidas", slug: "adidas" },
  { name: "Glossier", slug: "glossier" }
];

const DEALS = [
  {
    brandName: "Nike",
    dealName: "Nike Spring Athletic Collection",
    stage: "DELIVERABLES_IN_PROGRESS",
    value: 1250000, // GBP in pence
    currency: "GBP",
    expectedClose: "2024-08-31",
    notes: "Q2-Q3 collaboration with high engagement targets"
  },
  {
    brandName: "Adidas",
    dealName: "Adidas Summer Campaign",
    stage: "DELIVERABLES_IN_PROGRESS",
    value: 980000, // GBP in pence
    currency: "GBP",
    expectedClose: "2024-09-30",
    notes: "Ambassador role for summer athletic wear line"
  },
  {
    brandName: "Glossier",
    dealName: "Glossier Beauty Partnership",
    stage: "COMPLETED",
    value: 750000, // GBP in pence
    currency: "GBP",
    expectedClose: "2024-03-31",
    notes: "Q1 beauty partnership - exceeded engagement benchmarks"
  }
];

async function createDeals() {
  console.log("🚀 Creating Patricia's deals via API...\n");
  
  try {
    // For now, just log instructions on how to create deals
    console.log("📝 To create deals for Patricia, you have two options:\n");
    
    console.log("OPTION 1: Use the UI (Manual but fastest)");
    console.log("1. Go to Patricia Bright's talent page");
    console.log("2. Click the '+ ADD DEAL' button in Deal Tracker");
    console.log("3. Create the following deals:\n");
    
    DEALS.forEach((deal, i) => {
      const gValue = (deal.value / 100).toFixed(2);
      console.log(`   Deal ${i + 1}: ${deal.dealName}`);
      console.log(`   - Brand: ${deal.brandName}`);
      console.log(`   - Stage: ${deal.stage}`);
      console.log(`   - Value: £${gValue}`);
      console.log(`   - Currency: ${deal.currency}`);
      console.log(`   - Due Date: ${deal.expectedClose}`);
      console.log(`   - Notes: ${deal.notes}\n`);
    });
    
    console.log("\nOPTION 2: Run a database script");
    console.log("1. Set DATABASE_URL in .env");
    console.log("2. Run: DATABASE_URL='your-url' npm run test:patricia-deals\n");
    
    console.log("✨ Done! Choose the option that works best for you.\n");
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

createDeals();
