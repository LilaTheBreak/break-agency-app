import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPatriciaUrl() {
  try {
    console.log('🔧 Fixing Patricia\'s profile image URL...\n');

    // Find Patricia
    const patricia = await prisma.talent.findFirst({
      where: { name: 'Patricia Bright' },
    });

    if (!patricia) {
      console.error('❌ Patricia Bright not found');
      process.exit(1);
    }

    if (!patricia.profileImageUrl) {
      console.error('❌ Patricia has no profile image URL');
      process.exit(1);
    }

    console.log('Current URL (with &amp;):');
    console.log(patricia.profileImageUrl);
    console.log('');

    // Decode HTML entities
    const decodedUrl = patricia.profileImageUrl
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    console.log('Decoded URL:');
    console.log(decodedUrl);
    console.log('');

    // Update the database
    const updated = await prisma.talent.update({
      where: { id: patricia.id },
      data: { profileImageUrl: decodedUrl },
    });

    console.log('✅ Updated Patricia\'s profile image URL!');
    console.log(`   Last synced: ${updated.lastProfileImageSyncAt}`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

fixPatriciaUrl();
