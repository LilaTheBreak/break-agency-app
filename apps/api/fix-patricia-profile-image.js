import { PrismaClient } from '@prisma/client';
import { TalentProfileImageService } from './apps/api/src/services/talent/TalentProfileImageService.js';

const prisma = new PrismaClient();

async function fixPatriciaProfileImage() {
  try {
    console.log('🔄 Attempting to fix Patricia Bright\'s profile image...\n');

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

    console.log(`✅ Found Patricia Bright (ID: ${patricia.id})`);
    console.log(`📱 Connected platforms:`, patricia.SocialAccountConnection.map(s => `${s.platform} (@${s.handle})`).join(', '));
    console.log();

    // Try to sync profile image
    const imageService = new TalentProfileImageService();
    const result = await imageService.syncTalentProfileImage(patricia.id);

    if (result.success) {
      console.log('✅ Profile image sync successful!');
      console.log(`   Source: ${result.source}`);
      console.log(`   URL: ${result.imageUrl || '(initials fallback)'}`);
    } else {
      console.error('❌ Profile image sync failed:', result.error);
      
      // Fallback: Manually set a default profile image
      console.log('\n📋 Falling back to manual update...');
      const updated = await prisma.talent.update({
        where: { id: patricia.id },
        data: {
          profileImageUrl: null,
          profileImageSource: 'initials',
          lastProfileImageSyncAt: new Date(),
        },
      });
      console.log('✅ Updated to use initials fallback');
    }

    // Fetch and display final state
    const final = await prisma.talent.findUnique({
      where: { id: patricia.id },
    });

    console.log('\n📸 Final profile image state:');
    console.log(`   URL: ${final.profileImageUrl || '(none - using initials)'}`);
    console.log(`   Source: ${final.profileImageSource}`);
    console.log(`   Last synced: ${final.lastProfileImageSyncAt?.toISOString() || '(never)'}`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

fixPatriciaProfileImage();
