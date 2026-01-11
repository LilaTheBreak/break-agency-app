import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPatriciaProfile() {
  try {
    console.log('🔍 Checking Patricia Bright\'s profile data...\n');

    // Find Patricia
    const patricia = await prisma.talent.findFirst({
      where: { name: 'Patricia Bright' },
      include: {
        User: true,
        SocialAccountConnection: true,
        TalentSocial: true,
      },
    });

    if (!patricia) {
      console.error('❌ Patricia Bright not found');
      process.exit(1);
    }

    console.log('👤 TALENT INFO:');
    console.log(`   ID: ${patricia.id}`);
    console.log(`   Name: ${patricia.name}`);
    console.log(`   Display Name: ${patricia.displayName}`);
    console.log(`   Profile Image URL: ${patricia.profileImageUrl || '(none)'}`);
    console.log(`   Profile Image Source: ${patricia.profileImageSource || '(none)'}`);
    console.log(`   Last Synced: ${patricia.lastProfileImageSyncAt?.toISOString() || '(never)'}`);
    
    console.log('\n👥 LINKED USER:');
    if (patricia.User) {
      console.log(`   ID: ${patricia.User.id}`);
      console.log(`   Email: ${patricia.User.email}`);
      console.log(`   Avatar URL: ${patricia.User.avatarUrl || '(none)'}`);
    } else {
      console.log('   (not linked)');
    }

    console.log('\n📱 SOCIAL ACCOUNT CONNECTIONS:');
    if (patricia.SocialAccountConnection.length > 0) {
      patricia.SocialAccountConnection.forEach((conn) => {
        console.log(`   - ${conn.platform}`);
        console.log(`     Handle: @${conn.handle}`);
        console.log(`     Connected: ${conn.connected}`);
        console.log(`     Last Synced: ${conn.lastSyncedAt?.toISOString() || '(never)'}`);
      });
    } else {
      console.log('   (none)');
    }

    console.log('\n📝 TALENT SOCIAL LINKS:');
    if (patricia.TalentSocial.length > 0) {
      patricia.TalentSocial.forEach((social) => {
        console.log(`   - ${social.platform}: @${social.handle}`);
        console.log(`     URL: ${social.url}`);
      });
    } else {
      console.log('   (none)');
    }

    console.log('\n✅ Check complete!');

    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkPatriciaProfile();
