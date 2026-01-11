import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyPatriciaImage() {
  try {
    console.log('🖼️  Verifying Patricia\'s profile image...\n');

    const patricia = await prisma.talent.findFirst({
      where: { name: 'Patricia Bright' },
    });

    if (!patricia || !patricia.profileImageUrl) {
      console.error('❌ Patricia not found or no image URL');
      process.exit(1);
    }

    console.log('✅ Found Patricia\'s profile image URL');
    console.log(`   URL: ${patricia.profileImageUrl.substring(0, 80)}...`);
    console.log(`   Source: ${patricia.profileImageSource}`);
    console.log(`   Last Synced: ${patricia.lastProfileImageSyncAt?.toISOString()}\n`);

    // Verify URL is properly decoded (no &amp;)
    if (patricia.profileImageUrl.includes('&amp;')) {
      console.error('❌ ERROR: URL still contains HTML entities (&amp;)');
      process.exit(1);
    }

    // Test if the URL is accessible
    console.log('Testing URL accessibility...');
    try {
      const response = await axios.head(patricia.profileImageUrl, {
        timeout: 5000,
        maxRedirects: 2,
      });
      console.log(`✅ Image URL is accessible (HTTP ${response.status})`);
      console.log(`   Content-Type: ${response.headers['content-type']}`);
      console.log(`   Content-Length: ${response.headers['content-length']} bytes`);
    } catch (err) {
      console.warn(`⚠️  Warning: Could not verify image accessibility`);
      if (err instanceof Error) {
        console.warn(`   ${err.message}`);
      }
    }

    console.log('\n✅ Patricia\'s profile image is ready to display!');
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e instanceof Error ? e.message : String(e));
    await prisma.$disconnect();
    process.exit(1);
  }
}

verifyPatriciaImage();
