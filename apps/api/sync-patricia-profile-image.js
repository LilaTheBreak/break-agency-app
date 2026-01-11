import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncPatriciaProfileImage() {
  try {
    console.log('🎯 Syncing Patricia Bright profile image from Instagram...\n');

    // Find Patricia
    const patricia = await prisma.talent.findFirst({
      where: { name: 'Patricia Bright' },
      include: {
        SocialAccountConnection: {
          where: { connected: true },
          include: { SocialProfile: true },
        },
      },
    });

    if (!patricia) {
      console.error('❌ Patricia Bright not found');
      process.exit(1);
    }

    console.log(`✅ Found Patricia: ${patricia.name} (ID: ${patricia.id})`);
    console.log(`📱 Connected accounts: ${patricia.SocialAccountConnection.length}`);
    patricia.SocialAccountConnection.forEach(conn => {
      console.log(`   - ${conn.platform}: @${conn.handle}`);
    });
    console.log();

    // Import and run the sync service
    const { TalentProfileImageService } = await import(
      './src/services/talent/TalentProfileImageService.js'
    );
    
    const service = new TalentProfileImageService();
    const result = await service.syncTalentProfileImage(patricia.id);

    console.log(`\n${result.success ? '✅ Sync successful!' : '❌ Sync failed'}`);
    if (result.imageUrl) {
      console.log(`📸 Profile image URL: ${result.imageUrl.substring(0, 60)}...`);
      console.log(`   Source: ${result.source}`);
    }
    if (result.error) {
      console.log(`Error: ${result.error}`);
    }

    // Show updated talent record
    const updated = await prisma.talent.findUnique({
      where: { id: patricia.id },
    });

    console.log(`\n📋 Updated talent record:`);
    console.log(`   Name: ${updated.name}`);
    console.log(`   Profile Image URL: ${updated.profileImageUrl ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`   Profile Image Source: ${updated.profileImageSource || 'none'}`);
    console.log(`   Last Sync: ${updated.lastProfileImageSyncAt?.toISOString()}`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

syncPatriciaProfileImage();
