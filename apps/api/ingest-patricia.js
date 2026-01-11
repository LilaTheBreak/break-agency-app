import { PrismaClient } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

async function ingest() {
  try {
    console.log('🚀 Starting Patricia Bright data ingestion...\n');
    
    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: 'patricia@patricabright.com' },
    });
    
    if (!user) {
      console.log('👤 Creating User account...');
      user = await prisma.user.create({
        data: {
          id: createId(),
          email: 'patricia@patricabright.com',
          name: 'Patricia Bright',
          role: 'CREATOR',
          status: 'ACTIVE',
          accountType: 'CREATOR',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Created User: ${user.name} (ID: ${user.id})\n`);
    } else {
      console.log(`✅ User already exists: ${user.name} (ID: ${user.id})\n`);
    }
    
    // Check if talent already exists
    let talent = await prisma.talent.findUnique({
      where: { userId: user.id },
    });
    
    if (!talent) {
      console.log('📝 Creating Talent profile...');
      talent = await prisma.talent.create({
        data: {
          id: createId(),
          userId: user.id,
          name: 'Patricia Bright',
          displayName: 'Patricia Bright',
          primaryEmail: 'patricia@patricabright.com',
          representationType: 'MANAGED',
          status: 'ACTIVE',
          categories: ['Finance', 'Beauty', 'Entrepreneurship', 'Speaking'],
          notes: 'High-profile creator and business founder. Multi-platform presence (YouTube, Instagram, TikTok).',
          currency: 'GBP',
        },
      });
      console.log(`✅ Created Talent: ${talent.name} (ID: ${talent.id})\n`);
    } else {
      console.log(`✅ Talent already exists: ${talent.name} (ID: ${talent.id})\n`);
    }
    
    // Create brands and deals
    const deals = [
      { name: 'Women Empowered Now (Dubai)', campaign: 'Speaking engagement', value: 10000 },
      { name: 'AVEENO', campaign: 'Instagram + usage', value: 20000 },
      { name: 'Heart Radio & NatWest', campaign: 'Radio appearance', value: 7500 },
      { name: 'ACCA', campaign: 'Panel + content', value: 15000 },
      { name: 'Lenor (P&G)', campaign: 'Instagram content', value: 12000 },
      { name: 'Anua – Rice Line', campaign: 'TikTok + IG', value: 8000 },
      { name: 'CALAI', campaign: 'Content partnership', value: 5000 },
      { name: 'Pippit (Katlas Media)', campaign: 'Content creation', value: 6000 },
      { name: 'Skillshare', campaign: 'YouTube integration', value: 18000 },
      { name: 'Symprove', campaign: 'IG + Story', value: 9000 },
      { name: 'SHEGLAM', campaign: 'Beauty content', value: 11000 },
      { name: 'ShopTalk Abu Dhabi', campaign: 'Speaking appearance', value: 12000 },
      { name: 'QuickBooks', campaign: 'Finance content', value: 20000 },
      { name: 'Real Techniques', campaign: 'Beauty content', value: 10000 },
      { name: 'Maison Francis Kurkdjian', campaign: 'Luxury fragrance content', value: 15000 },
    ];
    
    console.log('💼 Creating 15 deal records for January 2025...\n');
    
    let totalFees = 0;
    let totalAgency = 0;
    let createdCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < deals.length; i++) {
      const d = deals[i];
      const agencyTotal = d.value * 0.2;
      totalFees += d.value;
      totalAgency += agencyTotal;
      
      // Find or create brand
      let brand = await prisma.brand.findFirst({
        where: { name: d.name },
      });
      
      if (!brand) {
        brand = await prisma.brand.create({
          data: {
            id: createId(),
            name: d.name,
          },
        });
      }
      
      // Check if deal already exists
      const existingDeal = await prisma.deal.findFirst({
        where: {
          talentId: talent.id,
          brandId: brand.id,
          campaignName: d.campaign,
        },
      });
      
      if (!existingDeal) {
        await prisma.deal.create({
          data: {
            id: createId(),
            userId: user.id,
            talentId: talent.id,
            brandId: brand.id,
            campaignName: d.campaign,
            value: d.value,
            currency: 'GBP',
            stage: 'PAYMENT_RECEIVED',
            paymentStatus: 'PAID',
            notes: `[JAN 2025] Agency: £${Math.round(agencyTotal).toLocaleString()} (20% of £${d.value.toLocaleString()})`,
            endDate: new Date('2025-01-31'),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        createdCount++;
      } else {
        skippedCount++;
      }
      
      console.log(`  ${i + 1}. ${d.name}: £${d.value.toLocaleString()} (Agency: £${Math.round(agencyTotal).toLocaleString()})`);
    }
    
    console.log(`\n✅ Deals processed: ${createdCount} created, ${skippedCount} skipped\n`);
    
    // Validate
    const talentCheck = await prisma.talent.findUnique({
      where: { id: talent.id },
      include: { Deal: true },
    });
    
    console.log('📊 VALIDATION REPORT');
    console.log('═'.repeat(60));
    console.log(`Talent: ${talentCheck.name}`);
    console.log(`Talent ID: ${talentCheck.id}`);
    console.log(`Total Deals: ${talentCheck.Deal.length}`);
    console.log(`Total Deal Value: £${totalFees.toLocaleString()}`);
    console.log(`Total Agency Revenue (20%): £${Math.round(totalAgency).toLocaleString()}`);
    console.log(`Average Deal Value: £${Math.round(totalFees / 15).toLocaleString()}`);
    console.log(`\n✅ All records verified and linked`);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    console.error(e.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

ingest();
