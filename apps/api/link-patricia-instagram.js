import { PrismaClient } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

async function linkInstagram() {
  try {
    console.log('🔗 Linking Patricia Bright Instagram account...\n');
    
    // Find Patricia Bright's talent record
    const talent = await prisma.talent.findFirst({
      where: { name: 'Patricia Bright' },
    });
    
    if (!talent) {
      console.error('❌ Patricia Bright talent record not found');
      process.exit(1);
    }
    
    console.log(`✅ Found talent: ${talent.name} (ID: ${talent.id})\n`);
    
    // Check if Instagram already linked
    const existingInstagram = await prisma.talentSocial.findUnique({
      where: {
        talentId_platform_handle: {
          talentId: talent.id,
          platform: 'INSTAGRAM',
          handle: 'patriciabright',
        },
      },
    });
    
    if (existingInstagram) {
      console.log('✅ Instagram already linked to Patricia Bright');
      console.log(`   Handle: @${existingInstagram.handle}`);
      console.log(`   URL: ${existingInstagram.url}`);
      await prisma.$disconnect();
      process.exit(0);
    }
    
    // Create Instagram link
    console.log('📝 Creating Instagram social link...');
    const instaLink = await prisma.talentSocial.create({
      data: {
        id: createId(),
        talentId: talent.id,
        platform: 'INSTAGRAM',
        handle: 'patriciabright',
        url: 'https://www.instagram.com/patriciabright/?hl=en',
        displayName: 'Patricia Bright',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    // CRITICAL: Also create SocialAccountConnection for Social Intelligence service
    console.log('🔗 Creating SocialAccountConnection for social intelligence...');
    let accountConnection = null;
    let socialProfile = null;
    try {
      accountConnection = await prisma.socialAccountConnection.upsert({
        where: {
          creatorId_platform: {
            creatorId: talent.id,
            platform: 'INSTAGRAM',
          },
        },
        update: {
          handle: 'patriciabright',
          connected: true,
          syncStatus: 'READY',
          updatedAt: new Date(),
        },
        create: {
          id: `conn_${talent.id}_INSTAGRAM_${Date.now()}`,
          creatorId: talent.id,
          platform: 'INSTAGRAM',
          handle: 'patriciabright',
          profileUrl: 'https://www.instagram.com/patriciabright/?hl=en',
          connected: true,
          syncStatus: 'READY',
          connectionType: 'MANUAL',
          updatedAt: new Date(),
        },
      });
      console.log('✅ SocialAccountConnection created:', accountConnection.id);
      
      // Also create SocialProfile record for social intelligence data
      console.log('📊 Creating SocialProfile for social data...');
      socialProfile = await prisma.socialProfile.upsert({
        where: { connectionId: accountConnection.id },
        update: {
          handle: 'patriciabright',
          displayName: 'Patricia Bright',
          platform: 'INSTAGRAM',
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        },
        create: {
          id: createId(),
          connectionId: accountConnection.id,
          platform: 'INSTAGRAM',
          handle: 'patriciabright',
          displayName: 'Patricia Bright',
          profileImageUrl: null,
          followerCount: 0,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log('✅ SocialProfile created:', socialProfile.id);
    } catch (connError) {
      console.warn('⚠️  Account/Profile creation failed:', connError.message);
    }
    
    console.log(`\n✅ Instagram linked successfully!`);
    console.log('───────────────────────────────────');
    console.log(`Platform: ${instaLink.platform}`);
    console.log(`Handle: @${instaLink.handle}`);
    console.log(`URL: ${instaLink.url}`);
    console.log(`Linked to: ${talent.name}`);
    console.log(`Created: ${instaLink.createdAt.toISOString()}`);
    console.log(`\n📊 Social Intelligence Setup:`);
    console.log(`   Connection: ${accountConnection ? '✅ READY' : '⚠️  FALLBACK'}`);
    console.log(`   Profile: ${socialProfile ? '✅ READY' : '⚠️  FALLBACK'}`);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    console.error(e.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

linkInstagram();
