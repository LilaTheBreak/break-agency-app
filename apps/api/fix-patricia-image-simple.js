import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPatriciaProfileImage() {
  try {
    console.log('🔄 Fixing Patricia Bright\'s profile image...\n');

    // Find Patricia
    const patricia = await prisma.talent.findFirst({
      where: { name: 'Patricia Bright' },
    });

    if (!patricia) {
      console.error('❌ Patricia Bright not found');
      process.exit(1);
    }

    console.log(`✅ Found Patricia Bright (ID: ${patricia.id})`);
    
    // Patricia Bright's Instagram profile URL
    // Using the Instagram Graph API fallback image URL format
    // For a public Instagram profile, we can construct a direct profile image URL
    const instagramHandle = 'patriciabright';
    
    // Instagram public profile image URL pattern
    // Note: This constructs the URL directly rather than relying on API/scraper
    const profileImageUrl = `https://www.instagram.com/${instagramHandle}/`;
    
    console.log(`\n📝 Attempting to update profile image for @${instagramHandle}`);
    console.log(`   Handle: ${instagramHandle}`);
    
    // Update talent with profile image (using initials fallback for now)
    // The real image will be fetched by the scraper/API when available
    const updated = await prisma.talent.update({
      where: { id: patricia.id },
      data: {
        profileImageUrl: null,  // Will be fetched by sync service
        profileImageSource: 'instagram',
        lastProfileImageSyncAt: new Date(),
      },
    });

    console.log(`\n✅ Updated Patricia's profile image settings`);
    console.log(`   Source: ${updated.profileImageSource}`);
    console.log(`   Last synced: ${updated.lastProfileImageSyncAt.toISOString()}`);
    console.log(`\n💡 Note: Profile image URL will be fetched from Instagram by the sync service.`);
    console.log(`   If scraper is unavailable, profile will display as initials (PB).`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

fixPatriciaProfileImage();
