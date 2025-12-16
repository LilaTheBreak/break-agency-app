import prisma from "../../src/lib/prisma.js";

async function main() {
  const roles = [
    "ADMIN",
    "SUPER_ADMIN",
    "AGENT",
    "TALENT",
    "EXCLUSIVE_TALENT",
    "UGC_CREATOR",
    "BRAND",
    "FOUNDER"
  ];

  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Roles seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
