import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAILS = ["lila@thebreakco.com", "mo@thebreakco.com"];

async function main() {
  console.log("🔧 Starting admin role and onboarding status fix...");

  const superAdminRole = await prisma.role.findUnique({
    where: { name: "SUPER_ADMIN" },
  });

  if (!superAdminRole) {
    throw new Error(
      "SUPER_ADMIN role not found. Please seed the database first with `pnpm seed:auth`."
    );
  }

  for (const email of ADMIN_EMAILS) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log(`- User ${email} not found, skipping.`);
      continue;
    }

    // 1. Ensure onboarding is complete
    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingComplete: true },
    });

    // 2. Ensure SUPER_ADMIN role is assigned
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: superAdminRole.id } },
      create: { userId: user.id, roleId: superAdminRole.id },
      update: {},
    });

    console.log(`✔ User ${email} is now a fully onboarded SUPER_ADMIN.`);
  }

  console.log("🎉 Admin fix script complete.");
}

main()
  .catch((e) => {
    console.error("❌ Admin fix script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });