import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPatricia() {
  try {
    const patricia = await prisma.talent.findFirst({
      where: { name: { contains: 'Patricia', mode: 'insensitive' } }
    });

    if (patricia) {
      console.log('Patricia Bright Details:');
      console.log('ID:', patricia.id);
      console.log('Name:', patricia.name);
      console.log('Display Name:', patricia.displayName);
      console.log('Representation Type:', patricia.representationType);
      console.log('Status:', patricia.status);
    } else {
      console.log('Patricia not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPatricia();
