import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePatricia() {
  try {
    console.log('🔍 Finding Patricia Bright...');
    
    const patricia = await prisma.talent.findFirst({
      where: {
        OR: [
          { name: { contains: 'Patricia', mode: 'insensitive' } },
          { displayName: { contains: 'Patricia', mode: 'insensitive' } }
        ]
      }
    });

    if (!patricia) {
      console.error('❌ Patricia not found');
      process.exit(1);
    }

    console.log(`✅ Found: ${patricia.displayName} (ID: ${patricia.id})`);
    console.log(`   Current type: ${patricia.representationType}`);

    const updated = await prisma.talent.update({
      where: { id: patricia.id },
      data: { representationType: 'EXCLUSIVE' }
    });

    console.log(`✅ Updated to: ${updated.representationType}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updatePatricia();
