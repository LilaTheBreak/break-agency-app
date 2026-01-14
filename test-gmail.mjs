import prisma from './apps/api/src/lib/prisma.js' with { type: 'module' };
// Alternative path imports
const projectRoot = import.meta.url;
import { fileURLToPath } from 'url';

async function main() {
  const count = await prisma.gmailToken.count();
  console.log('Gmail tokens count:', count);
  
  const tokens = await prisma.gmailToken.findMany({
    take: 5,
    select: { userId: true, lastSyncedAt: true, lastError: true, lastErrorAt: true }
  });
  console.log('Sample tokens:', JSON.stringify(tokens, null, 2));
  
  // Check emails
  const emailCount = await prisma.inboundEmail.count();
  console.log('Total inbound emails:', emailCount);
  
  const recentEmails = await prisma.inboundEmail.findMany({
    take: 5,
    orderBy: { receivedAt: 'desc' },
    select: { id: true, gmailId: true, platform: true, userId: true, fromEmail: true, subject: true, receivedAt: true }
  });
  console.log('Recent emails:', JSON.stringify(recentEmails, null, 2));
  
  await prisma.$disconnect();
}

main().catch(console.error);
