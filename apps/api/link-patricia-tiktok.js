import { PrismaClient } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

async function linkTikTok() {
  try {
    console.log('🔗 Linking Patricia Bright TikTok account...\n');
    
    // Find Patricia Bright's talent record
    const talent = await prisma.talent.findFirst({
      where: { name: 'Patricia Bright' },
    });
    
    if (!talent) {
      console.error('❌ Patricia Bright talent record not found');
      process.exit(1);
    }
    
    console.log(`✅ Found talent: ${talent.name} (ID: ${talent.id})\n`);
    
    // Check if TikTok already linked
    const existingTikTok = await prisma.talentSocial.findUnique({
      where: {
        talentId_platform_handle: {
          talentId: talent.id,
          platform: 'TIKTOK',
          handle: 'patriciabright',
        },
      },
    });
    
    if (existingTikTok) {
      console.log('✅ TikTok already linked to Patricia Bright');
      console.log(`   Handle: @${existingTikTok.handle}`);
      console.log(`   URL: ${existingTikTok.url}`);
      await prisma.$disconnect();
      process.exit(0);
    }
    
    // Create TikTok social link
    console.log('📝 Creating TikTok social link...');
    const tikTokLink = await prisma.talentSocial.create({
      data: {
        id: createId(),
        talentId: talent.id,
        platform: 'TIKTOK',
        handle: 'patriciabright',
        url: 'https://www.tiktok.com/@patriciabright?lang=en-GB',
        displayName: 'Patricia Bright',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    // Create SocialAccountConnection for social intelligence
    console.log('🔗 Creating SocialAccountConnection...');
    const accountConnection = await prisma.socialAccountConnection.upsert({
      where: {
        creatorId_platform: {
          creatorId: talent.id,
          platform: 'TIKTOK',
        },
      },
      update: {
        handle: 'patriciabright',
        connected: true,
        syncStatus: 'READY',
        updatedAt: new Date(),
      },
      create: {
        id: `conn_${talent.id}_TIKTOK_${Date.now()}`,
        creatorId: talent.id,
        platform: 'TIKTOK',
        handle: 'patriciabright',
        profileUrl: 'https://www.tiktok.com/@patriciabright?lang=en-GB',
        connected: true,
        syncStatus: 'READY',
        connectionType: 'MANUAL',
        updatedAt: new Date(),
      },
    });
    
    console.log('✅ SocialAccountConnection created');
    
    // Create SocialProfile for social intelligence analytics
    console.log('📊 Creating SocialProfile...');
    const socialProfile = await prisma.socialProfile.upsert({
      where: { connectionId: accountConnection.id },
      update: {
        handle: 'patriciabright',
        displayName: 'Patricia Bright',
        platform: 'TIKTOK',
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        id: createId(),
        connectionId: accountConnection.id,
        platform: 'TIKTOK',
        handle: 'patriciabright',
        displayName: 'Patricia Bright',
        profileImageUrl: null,
        followerCount: 0,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    console.log(`\n✅ TikTok linked successfully!`);
    console.log('───────────────────────────────────');
    console.log(`Platform: ${tikTokLink.platform}`);
    console.log(`Handle: @${tikTokLink.handle}`);
    console.log(`URL: ${tikTokLink.url}`);
    console.log(`Linked to: ${talent.name}`);
    console.log(`Created: ${tikTokLink.createdAt.toISOString()}`);
    console.log(`\n📊 Social Intelligence Setup:`);
    console.log(`   Connection: ✅ READY`);
    console.log(`   Profile: ✅ READY`);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    console.error(e.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

linkTikTok();
