import { PrismaClient } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

(async () => {
  const conn = await prisma.socialAccountConnection.findFirst({
    where: {
      platform: 'INSTAGRAM',
      handle: 'patriciabright'
    }
  });
  
  if (!conn) {
    console.error('❌ SocialAccountConnection not found');
    process.exit(1);
  }
  
  console.log('Found connection:', conn.id);
  
  const existing = await prisma.socialProfile.findUnique({
    where: { connectionId: conn.id }
  });
  
  if (existing) {
    console.log('SocialProfile already exists:', existing.id);
    await prisma.$disconnect();
    process.exit(0);
  }
  
  console.log('Creating SocialProfile...');
  const profile = await prisma.socialProfile.create({
    data: {
      id: createId(),
      connectionId: conn.id,
      platform: 'INSTAGRAM',
      handle: 'patriciabright',
      displayName: 'Patricia Bright',
      profileImageUrl: null,
      followerCount: 0,
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
    }
  });
  
  console.log('✅ Created SocialProfile:', profile.id);
  console.log('   Connection ID:', profile.connectionId);
  console.log('   Platform:', profile.platform);
  console.log('   Handle:', profile.handle);
  
  await prisma.$disconnect();
})();
