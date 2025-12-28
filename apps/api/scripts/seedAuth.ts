import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ROLE_DEFINITIONS = [
  { name: "ADMIN", description: "Break Co. admin with full access" },
  { name: "TALENT_MANAGER", description: "Talent manager overseeing rosters" },
  { name: "EXCLUSIVE_TALENT", description: "Premium managed talent" },
  { name: "CREATOR", description: "Creator in the ecosystem" },
  { name: "UGC", description: "UGC-focused creator" },
  { name: "BRAND", description: "Brand or client team" },
  { name: "SUPERADMIN", description: "System superadmin" },
  { name: "FOUNDER", description: "Company founders" }
];

const SEEDED_USERS = [
  { email: "admin@thebreakco.com", name: "Break Admin", roles: ["ADMIN"] },
  { email: "manager@thebreakco.com", name: "Talent Manager", roles: ["TALENT_MANAGER"] },
  { email: "brand@thebreakco.com", name: "Brand Lead", roles: ["BRAND"] },
  { email: "exclusive@thebreakco.com", name: "Exclusive Talent", roles: ["EXCLUSIVE_TALENT"] },
  { email: "creator@thebreakco.com", name: "Creator Talent", roles: ["CREATOR"] },
  { email: "ugc@thebreakco.com", name: "UGC Creator", roles: ["UGC"] }
];

async function main() {
  for (const role of ROLE_DEFINITIONS) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role
    });
  }

  const roleMap = await loadRoleMap();

  for (const seed of SEEDED_USERS) {
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: { name: seed.name },
      create: {
        email: seed.email,
        name: seed.name
      }
    });

    for (const roleName of seed.roles) {
      const role = roleMap.get(roleName);
      if (!role) continue;
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: {
          userId: user.id,
          roleId: role.id
        }
      });
    }
  }

  console.log("Seeded roles and auth users");
}

async function loadRoleMap() {
  const roles = await prisma.role.findMany();
  return new Map(roles.map((role) => [role.name, role]));
}

main()
  .catch((error) => {
    console.error("Failed to seed auth data", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
