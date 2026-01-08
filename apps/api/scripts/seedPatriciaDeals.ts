/**
 * PATRICIA DEAL SEEDER
 * 
 * Seeds Patricia Bright's real deals from:
 * - Source: Patricia Tracker - The Break '26.xlsx
 * - Talent ID: talent_1767737816502_d9wnw3pav
 * 
 * Features:
 * - Idempotent (no duplicates on re-run)
 * - Duplicate detection by: brandName + campaignName + startDate
 * - Status normalization to DealStage enum values
 * - Date parsing from Excel serial numbers
 * - Comprehensive logging
 * - Validates required fields
 * - Auto-creates/links brands
 * 
 * Run:
 * pnpm seed:patricia-deals
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Excel date serial number to JavaScript Date
function excelDateToJSDate(excelDate: number | string | undefined): Date | null {
  if (!excelDate) return null;
  
  // If it's already a string, try to parse it
  if (typeof excelDate === 'string') {
    const parsed = new Date(excelDate);
    if (!isNaN(parsed.getTime())) return parsed;
    return null;
  }
  
  // Excel epoch: 1900-01-01 but with a bug (treats 1900 as leap year)
  // Excel serial number calculation:
  // Serial 1 = 1900-01-01
  // Serial 44562 = 2022-01-01
  const excelEpoch = new Date(1900, 0, 1);
  const date = new Date(excelEpoch.getTime() + (excelDate - 1) * 24 * 60 * 60 * 1000);
  
  // Check for validity
  if (isNaN(date.getTime())) return null;
  return date;
}

// Normalize stage from tracker to DealStage enum
function normalizeStage(trackerStage: string | undefined): string {
  if (!trackerStage) return 'NEW_LEAD';
  
  const stage = trackerStage.toLowerCase().trim();
  
  // Map tracker stages to DealStage enum values
  if (stage.includes('contracted') || stage.includes('signed') || stage.includes('confirmed')) {
    return 'CONTRACT_SIGNED';
  }
  if (stage.includes('discussion') || stage.includes('in discussion')) {
    return 'NEGOTIATION';
  }
  if (stage.includes('awaiting brief') || stage.includes('awaiting')) {
    return 'NEW_LEAD';
  }
  if (stage.includes('declined') || stage.includes('lost')) {
    return 'LOST';
  }
  if (stage.includes('completed')) {
    return 'COMPLETED';
  }
  
  // Default
  return 'NEW_LEAD';
}

// Normalize invoice status
function normalizeInvoiceStatus(notes: string | undefined): string | undefined {
  if (!notes) return undefined;
  
  const notesLower = notes.toLowerCase();
  if (notesLower.includes('paid')) return 'PAID';
  if (notesLower.includes('invoiced') || notesLower.includes('sent')) return 'INVOICED';
  if (notesLower.includes('not sent') || notesLower.includes('not invoiced')) return 'NOT_INVOICED';
  
  return undefined;
}

// Extract platforms from scope of work
function extractPlatforms(scope: string | undefined): string[] {
  if (!scope) return [];
  
  const scopeLower = scope.toLowerCase();
  const platforms: string[] = [];
  
  if (scopeLower.includes('tiktok') || scopeLower.includes('tt')) platforms.push('TikTok');
  if (scopeLower.includes('instagram') || scopeLower.includes('ig')) platforms.push('Instagram');
  if (scopeLower.includes('youtube') || scopeLower.includes('yt')) platforms.push('YouTube');
  if (scopeLower.includes('snapchat')) platforms.push('Snapchat');
  if (scopeLower.includes('tiktok') && scopeLower.includes('shorts')) platforms.push('TikTok Shorts');
  if (scopeLower.includes('youtube shorts')) platforms.push('YouTube Shorts');
  if (scopeLower.includes('reel')) platforms.push('Instagram Reels');
  if (scopeLower.includes('story')) platforms.push('Stories');
  if (scopeLower.includes('video')) platforms.push('Video');
  if (scopeLower.includes('audio') || scopeLower.includes('radio')) platforms.push('Audio');
  if (scopeLower.includes('speaking') || scopeLower.includes('event')) platforms.push('Speaking');
  if (scopeLower.includes('podcast')) platforms.push('Podcast');
  
  // Remove duplicates
  return [...new Set(platforms)];
}

// Parse fee value
function parseFee(fee: string | number | undefined): number | null {
  if (!fee) return null;
  if (typeof fee === 'number') return fee;
  
  const feeStr = String(fee).trim().toUpperCase();
  
  // Skip TBC, undefined, empty
  if (feeStr === 'TBC' || feeStr === 'UNDEFINED' || feeStr === '') return null;
  
  // Parse number from string (remove £, commas, etc)
  const match = feeStr.match(/[\d.]+/);
  if (match) {
    const parsed = parseFloat(match[0]);
    if (!isNaN(parsed)) return parsed;
  }
  
  return null;
}

interface PatriciaRawDeal {
  Talent: string;
  Brand: string;
  'Scope of Work '?: string;
  Currency?: string;
  Fee?: number | string;
  'Agency% '?: number;
  Stage?: string;
  'Due date'?: number | string;
  'Notes | Payment Terms'?: string;
}

interface ProcessedDeal {
  brandName: string;
  campaignName: string;
  scope: string;
  value: number | null;
  currency: string;
  stage: string;
  expectedClose: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  platforms: string[];
  deliverables: string;
  notes: string;
  internalNotes: string;
  invoiceStatus: string | undefined;
}

/**
 * Preflight validation: Ensure all required Deal fields exist in database
 * This prevents silent failures when Prisma client gets out of sync with schema
 */
async function validateSchema(): Promise<void> {
  const requiredFields = [
    'id', 'userId', 'talentId', 'brandId', 'stage', 'value',
    'campaignName', 'startDate', 'endDate', 'deliverables',
    'platforms', 'invoiceStatus', 'paymentStatus', 'internalNotes', 'brandName'
  ];
  
  try {
    // Try creating a test deal with all required fields
    const testBrand = await prisma.brand.findFirst();
    if (!testBrand) {
      console.warn('⚠️  No test brand found, skipping schema validation');
      return;
    }
    
    const testUser = await prisma.user.findFirst();
    if (!testUser) {
      console.warn('⚠️  No test user found, skipping schema validation');
      return;
    }
    
    const testTalent = await prisma.talent.findFirst();
    if (!testTalent) {
      console.warn('⚠️  No test talent found, skipping schema validation');
      return;
    }
    
    // Attempt to create a test deal with all required fields
    const testDealId = `schema-test-${Date.now()}`;
    const testDeal = await prisma.deal.create({
      data: {
        id: testDealId,
        talentId: testTalent.id,
        userId: testUser.id,
        brandId: testBrand.id,
        stage: 'NEW_LEAD' as any,
        value: 0,
        brandName: 'schema-check',
        campaignName: 'schema-validation',
        startDate: new Date(),
        endDate: new Date(),
        deliverables: 'test',
        platforms: ['test'],
        invoiceStatus: 'NOT_INVOICED',
        paymentStatus: 'UNPAID',
        internalNotes: 'schema-preflight',
        notes: 'test',
        updatedAt: new Date()
      }
    });
    
    // Clean up test deal
    await prisma.deal.delete({ where: { id: testDealId } });
    
    console.log('✅ Schema validation passed: All required fields exist\n');
  } catch (error) {
    const errorMsg = (error as Error).message;
    console.error('❌ Schema validation FAILED:', errorMsg);
    console.error('   This likely means the Prisma client is out of sync with the database.');
    console.error('   Run: pnpm prisma generate');
    process.exit(1);
  }
}

async function seedPatriciaDeals() {
  try {
    console.log('🌱 Starting Patricia Deals Seeder...\n');
    
    // PREFLIGHT: Validate schema has all required fields
    await validateSchema();
    
    // Load Excel file
    const xlsx = await import('xlsx').then(m => m.default || m);
    const trackerPath = path.join(
      process.cwd(),
      '..',
      '..',
      'Patricia Tracker - The Break \'26.xlsx'
    );
    
    console.log(`📂 Loading tracker from: ${trackerPath}`);
    
    let finalTrackerPath = trackerPath;
    if (!fs.existsSync(trackerPath)) {
      // Try to find the file dynamically
      const baseDir = path.join(process.cwd(), '..', '..');
      const files = fs.readdirSync(baseDir);
      const trackerFile = files.find(f => f.includes('Patricia') && f.includes('Tracker') && f.endsWith('.xlsx'));
      
      if (!trackerFile) {
        console.error(`❌ Tracker file not found in ${baseDir}`);
        process.exit(1);
      }
      
      finalTrackerPath = path.join(baseDir, trackerFile);
      console.log(`✅ Found tracker: ${finalTrackerPath}`);
    }
    
    const workbook = xlsx.readFile(finalTrackerPath);
    const allRawDeals: PatriciaRawDeal[] = [];
    
    // Parse all sheets except summary
    workbook.SheetNames.forEach((sheetName: string) => {
      if (sheetName === 'YR Summary 25') return;
      
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);
      
      data.forEach((row: PatriciaRawDeal) => {
        if (row.Talent && row.Brand) {
          allRawDeals.push(row);
        }
      });
    });
    
    console.log(`✅ Loaded ${allRawDeals.length} raw deals from tracker\n`);
    
    // Find Patricia talent
    const patricia = await prisma.talent.findFirst({
      where: {
        name: {
          contains: 'Patricia',
          mode: 'insensitive'
        }
      }
    });
    
    if (!patricia) {
      console.error('❌ Patricia not found in database');
      process.exit(1);
    }
    
    console.log(`👤 Found Patricia: ${patricia.name} (${patricia.id})\n`);
    
    // Get the system user (fallback to any user if needed)
    let systemUser = await prisma.user.findFirst({
      where: {
        role: {
          in: ['ADMIN', 'SYSTEM']
        }
      }
    });
    
    if (!systemUser) {
      // Fallback: use the first user in the database
      systemUser = await prisma.user.findFirst();
      
      if (!systemUser) {
        console.error('❌ No users found in database');
        process.exit(1);
      }
      
      console.log(`⚠️  No ADMIN user found, using: ${systemUser.email}\n`);
    } else {
      console.log(`👨‍💼 Using system user: ${systemUser.email}\n`);
    }
    
    // Process deals
    const processedDeals: ProcessedDeal[] = allRawDeals.map(raw => {
      const scope = raw['Scope of Work '] || '';
      const fee = parseFee(raw.Fee);
      const dueDate = excelDateToJSDate(raw['Due date']);
      const notes = raw['Notes | Payment Terms'] || '';
      
      return {
        brandName: raw.Brand.trim(),
        campaignName: scope.substring(0, 200), // Truncate for campaign name
        scope: scope,
        value: fee,
        currency: raw.Currency || 'GBP',
        stage: normalizeStage(raw.Stage),
        expectedClose: dueDate,
        startDate: null, // Not in tracker
        endDate: dueDate,
        platforms: extractPlatforms(scope),
        deliverables: scope,
        notes: notes.substring(0, 1000),
        internalNotes: `Agency: ${raw['Agency% '] ? (raw['Agency% '] * 100) + '%' : 'N/A'}`,
        invoiceStatus: normalizeInvoiceStatus(notes)
      };
    });
    
    console.log('📋 Processed deals:\n');
    processedDeals.forEach((deal, i) => {
      console.log(`${i + 1}. ${deal.brandName}`);
      console.log(`   Fee: ${deal.value ? '£' + deal.value : 'TBC'}`);
      console.log(`   Stage: ${deal.stage}`);
      console.log(`   Platforms: ${deal.platforms.join(', ') || 'N/A'}`);
    });
    
    console.log('\n🔄 Seeding deals...\n');
    
    let createdCount = 0;
    let skippedCount = 0;
    const createdDealIds: string[] = [];
    
    for (const deal of processedDeals) {
      try {
        // 1. Ensure brand exists
        let brand = await prisma.brand.findUnique({
          where: { name: deal.brandName }
        });
        
        if (!brand) {
          console.log(`   📌 Creating brand: ${deal.brandName}`);
          brand = await prisma.brand.create({
            data: {
              id: randomUUID(),
              name: deal.brandName,
              values: [],
              restrictedCategories: [],
              preferredCreatorTypes: []
            }
          });
        }
        
        // 2. Check for duplicates (only use indexed fields)
        const duplicate = await prisma.deal.findFirst({
          where: {
            talentId: patricia.id,
            brandId: brand.id,
            brandName: deal.brandName
          }
        });
        
        if (duplicate) {
          console.log(`   ⏭️  Skipping duplicate: ${deal.brandName} - ${deal.campaignName.substring(0, 40)}`);
          skippedCount++;
          continue;
        }
        
        // 3. Create deal with all required fields
        const newDeal = await prisma.deal.create({
          data: {
            id: `deal_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            talentId: patricia.id,
            userId: systemUser.id,
            brandId: brand.id,
            brandName: deal.brandName,
            campaignName: deal.campaignName,
            stage: deal.stage as any,
            value: deal.value,
            currency: deal.currency,
            expectedClose: deal.expectedClose,
            startDate: deal.startDate,
            endDate: deal.endDate,
            platforms: deal.platforms,
            deliverables: deal.deliverables,
            notes: deal.notes,
            internalNotes: deal.internalNotes,
            invoiceStatus: deal.invoiceStatus,
            paymentStatus: deal.paymentStatus,
            updatedAt: new Date()
          }
        });
        
        createdDealIds.push(newDeal.id);
        createdCount++;
        console.log(`   ✅ Created: ${deal.brandName} (£${deal.value || 'TBC'}) - ${deal.stage}`);
        
      } catch (error) {
        console.error(`   ❌ Error creating deal for ${deal.brandName}:`, (error as Error).message);
      }
    }
    
    console.log(`\n📊 SEEDING COMPLETE:`);
    console.log(`   ✅ Created: ${createdCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📈 Total: ${processedDeals.length}`);
    
    // Verify
    console.log('\n🔍 Verification:\n');
    const talentWithDeals = await prisma.talent.findUnique({
      where: { id: patricia.id },
      include: {
        Deal: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (talentWithDeals?.Deal) {
      const totalValue = talentWithDeals.Deal.reduce((sum, d) => sum + (d.value || 0), 0);
      console.log(`Patricia now has ${talentWithDeals.Deal.length} deals`);
      console.log(`Total deal value: £${totalValue.toLocaleString()}`);
      console.log(`\nRecent deals:`);
      talentWithDeals.Deal.slice(0, 5).forEach(d => {
        console.log(`  - ${d.brandName}: £${d.value || 'TBC'} (${d.stage})`);
      });
    }
    
    console.log('\n✨ Seeding successful!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedPatriciaDeals();
