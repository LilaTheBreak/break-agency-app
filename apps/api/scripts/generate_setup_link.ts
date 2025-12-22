import prisma from "../src/lib/prisma.js";
import crypto from "crypto";

async function generateSetupLink() {
  try {
    const email = "mo@thebreakco.com";
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("❌ No account found for mo@thebreakco.com");
      console.log("   Creating account...\n");
      
      // Create the user account
      const newUser = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: email,
          name: "Maureen",
          role: "SUPERADMIN",
          onboarding_status: "invited",
          onboardingComplete: false,
          updatedAt: new Date(),
        }
      });
      
      console.log("✅ Account created for Maureen");
    }

    // Generate setup token
    const setupToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store token in admin_notes
    await prisma.user.update({
      where: { email },
      data: {
        admin_notes: JSON.stringify({
          setupToken,
          tokenExpiry: tokenExpiry.toISOString(),
          invitedBy: "system"
        }),
        onboarding_status: "invited",
      }
    });

    const webUrl = process.env.WEB_URL || "https://tbctbctbc.online";
    const setupUrl = `${webUrl}/setup?token=${setupToken}&email=${encodeURIComponent(email)}`;

    console.log("\n✅ Setup link generated for Maureen (mo@thebreakco.com)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🔗 Setup URL:");
    console.log(setupUrl);
    console.log("\n📅 Expires:", tokenExpiry.toLocaleString());
    console.log("\n📧 Send this link to Maureen so she can:");
    console.log("   1. Set her password");
    console.log("   2. Complete account setup");
    console.log("   3. Log in with email/password");
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } catch (error) {
    console.error("Error generating setup link:", error);
  } finally {
    await prisma.$disconnect();
  }
}

generateSetupLink();
