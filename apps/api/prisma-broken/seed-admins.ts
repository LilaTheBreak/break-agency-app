import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ----------------------------------------
   1. SYSTEM ROLES TO SEED
---------------------------------------- */
const rolesToSeed = [
  { name: "SUPER_ADMIN", description: "Full system access for Break founders." },
  { name: "ADMIN", description: "Break agency staff and internal team." },
  { name: "AGENT", description: "Talent manager responsible for managing creators." },
  { name: "TALENT", description: "Standard creator using the platform." },
  { name: "EXCLUSIVE_TALENT", description: "Vetted creator under exclusive management." },
  { name: "UGC_CREATOR", description: "Creator focused on user-generated content." },
  { name: "BRAND", description: "Brand client user." },
];

/* ----------------------------------------
   2. SUPER ADMINS TO SEED
---------------------------------------- */
const SUPER_ADMINS = [
  { email: "lila@thebreakco.com", name: "Lila" },
  { email: "mo@thebreakco.com", name: "Mo" },
];

/* ----------------------------------------
   SEED SCRIPT
---------------------------------------- */
async function main() {
  console.log("🌱 Seeding roles...");

  // 1. Seed all roles
  const roleMap: Record<string, any> = {};
  for (const role of rolesToSeed) {
    const seeded = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
    roleMap[role.name] = seeded.id;
    console.log(`✔ Role ready: ${role.name}`);
  }

  console.log("\n🌱 Seeding SUPER_ADMIN accounts...");

  // 2. Seed the super admin users
  for (const admin of SUPER_ADMINS) {
    const user = await prisma.user.upsert({
      where: { email: admin.email },
      update: { name: admin.name },
      create: {
        email: admin.email,
        name: admin.name,
      },
    });

    // Connect role
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: roleMap["SUPER_ADMIN"],
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: roleMap["SUPER_ADMIN"],
      },
    });

    console.log(`✔ SUPER_ADMIN seeded: ${user.email}`);
  }

  console.log("\n🎉 Role + Super Admin seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
