import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

(async () => {
  try {
    const talent = await prisma.talent.findFirst({
      where: { name: 'Patricia Bright' }
    });
    
    if (talent) {
      console.log('Patricia Bright Profile Image Info:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Profile Image URL: ${talent.profileImageUrl || 'NONE'}`);
      console.log(`Source: ${talent.profileImageSource}`);
      console.log(`Last Sync: ${talent.lastProfileImageSyncAt?.toISOString() || 'Never'}`);
    } else {
      console.log('Patricia Bright not found');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
