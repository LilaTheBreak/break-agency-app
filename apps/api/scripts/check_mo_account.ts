import prisma from "../src/lib/prisma.js";

async function checkMoAccount() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: "mo@thebreakco.com" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        onboarding_status: true,
        onboardingComplete: true,
        createdAt: true,
      }
    });

    if (!user) {
      console.log("❌ No account found for mo@thebreakco.com");
      return;
    }

    console.log("\n✅ Account found for Maureen (mo@thebreakco.com):");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Name: ${user.name || "Not set"}`);
    console.log(`Role: ${user.role}`);
    console.log(`Password: ${user.password ? "✅ SET (can use email/password login)" : "❌ NOT SET (can only use Google login)"}`);
    console.log(`Onboarding Status: ${user.onboarding_status || "Not set"}`);
    console.log(`Onboarding Complete: ${user.onboardingComplete}`);
    console.log(`Created: ${user.createdAt}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    if (!user.password) {
      console.log("⚠️  Maureen needs to set a password to use email/password login.");
      console.log("   You can generate a setup link using the generate_setup_link.ts script.\n");
    } else {
      console.log("✅ Maureen can log in with email/password!\n");
    }

  } catch (error) {
    console.error("Error checking account:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMoAccount();
