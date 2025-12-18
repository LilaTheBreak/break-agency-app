/**
 * Seed Test Opportunities & Submissions
 * Run with: npx tsx scripts/seedTestOpportunities.ts
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test opportunities and submissions...');

  // Create or get test users
  const creator = await prisma.user.upsert({
    where: { email: 'creator@thebreakco.com' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'creator@thebreakco.com',
      name: 'Test Creator',
      onboardingComplete: true,
    },
  });

  const brand = await prisma.user.upsert({
    where: { email: 'brand@thebreakco.com' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'brand@thebreakco.com',
      name: 'Test Brand',
      onboardingComplete: true,
    },
  });

  console.log(`✅ Found/created creator: ${creator.email}`);
  console.log(`✅ Found/created brand: ${brand.email}`);

  // Create test opportunities
  const opportunities = await Promise.all([
    prisma.opportunity.create({
      data: {
        brand: 'FashionCo',
        location: 'Remote',
        title: 'Summer Fashion Campaign',
        deliverables: '3 Instagram posts + 5 stories',
        payment: '£2,500',
        deadline: '2 weeks',
        status: 'Live brief · Login required to apply',
        image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b',
        logo: 'https://via.placeholder.com/100',
        type: 'Fashion',
        isActive: true,
        createdBy: brand.id,
      },
    }),
    prisma.opportunity.create({
      data: {
        brand: 'TechGear',
        location: 'Remote',
        title: 'Tech Product Review',
        deliverables: '1 YouTube review + 3 TikTok videos',
        payment: '£3,000',
        deadline: '3 weeks',
        status: 'Live brief · Login required to apply',
        image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
        logo: 'https://via.placeholder.com/100',
        type: 'Tech',
        isActive: true,
        createdBy: brand.id,
      },
    }),
    prisma.opportunity.create({
      data: {
        brand: 'FitLife',
        location: 'Remote',
        title: 'Fitness App Launch',
        deliverables: '5 workout posts + app demo',
        payment: '£1,800',
        deadline: '1 week',
        status: 'Live brief · Login required to apply',
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48',
        logo: 'https://via.placeholder.com/100',
        type: 'Fitness',
        isActive: true,
        createdBy: brand.id,
      },
    }),
    prisma.opportunity.create({
      data: {
        brand: 'GlowUp',
        location: 'Remote',
        title: 'Beauty Brand Partnership',
        deliverables: '4 posts/month + 1 video/month',
        payment: '£5,000/month',
        deadline: '3 months',
        status: 'Live brief · Login required to apply',
        image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9',
        logo: 'https://via.placeholder.com/100',
        type: 'Beauty',
        isActive: true,
        createdBy: brand.id,
      },
    }),
  ]);

  console.log(`✅ Created ${opportunities.length} opportunities`);

  // Create an application for the first opportunity
  const application = await prisma.opportunityApplication.create({
    data: {
      opportunityId: opportunities[0].id,
      creatorId: creator.id,
      status: 'shortlisted',
      pitch: 'I have 50k followers in the fashion niche and great engagement rates!',
      proposedRate: 2500,
    },
  });

  console.log(`✅ Created application for "${opportunities[0].title}"`);

  // Create test submissions for the applied opportunity
  const submissions = await Promise.all([
    prisma.submission.create({
      data: {
        creatorId: creator.id,
        opportunityId: opportunities[0].id,
        title: 'Summer Fashion Post 1',
        platform: 'instagram',
        status: 'draft',
        files: JSON.stringify([
          { url: 'https://example.com/draft1.jpg', type: 'image' },
          { url: 'https://example.com/draft2.jpg', type: 'image' },
        ]),
        revisions: JSON.stringify([]),
      },
    }),
    prisma.submission.create({
      data: {
        creatorId: creator.id,
        opportunityId: opportunities[0].id,
        title: 'Summer Fashion Stories',
        platform: 'instagram',
        status: 'pending',
        files: JSON.stringify([
          { url: 'https://example.com/story1.mp4', type: 'video' },
          { url: 'https://example.com/story2.mp4', type: 'video' },
          { url: 'https://example.com/story3.mp4', type: 'video' },
        ]),
        revisions: JSON.stringify([
          { version: 1, note: 'Added brand logo to story 1', date: new Date().toISOString() },
        ]),
        feedback: 'Looks great! Just add the brand hashtag.',
        submittedAt: new Date(),
      },
    }),
  ]);

  console.log(`✅ Created ${submissions.length} submissions`);

  // Summary
  console.log('\n📊 Seed Summary:');
  console.log(`   - Opportunities: ${opportunities.length}`);
  console.log(`   - Applications: 1`);
  console.log(`   - Submissions: ${submissions.length}`);
  console.log('\n🎉 Done! Test data ready.');
  console.log('\nTest with:');
  console.log('   curl http://localhost:5001/api/opportunities/creator/all');
  console.log('   curl http://localhost:5001/api/submissions');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
