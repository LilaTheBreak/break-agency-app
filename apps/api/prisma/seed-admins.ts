import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_ROLE_NAME = "ADMIN";
const ADMIN_USERS = [
  { email: "lila@thebreakco.com", name: "Lila" },
  { email: "mo@thebreakco.com", name: "Mo" }
];

async function ensureAdminRole() {
  const role = await prisma.role.upsert({
    where: { name: ADMIN_ROLE_NAME },
    update: {},
    create: {
      name: ADMIN_ROLE_NAME,
      description: "System administrator"
    }
  });
  console.log(`✔ Role ready: ${role.name}`);
  return role;
}

async function seedAdmins() {
  const adminRole = await ensureAdminRole();

  for (const userData of ADMIN_USERS) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { name: userData.name },
      create: {
        email: userData.email,
        name: userData.name
      }
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: adminRole.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        roleId: adminRole.id
      }
    });

    console.log(`✔ Admin seeded: ${user.email}`);
  }
}

seedAdmins()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
