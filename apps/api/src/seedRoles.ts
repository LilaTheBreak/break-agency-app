import prisma from "../lib/prisma.js";

async function main() {
  const roles = [
    "UGC_TALENT",
    "CREATOR",
    "EXCLUSIVE_TALENT",
    "ADMIN",
    "FOUNDER",
    "BRAND"
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