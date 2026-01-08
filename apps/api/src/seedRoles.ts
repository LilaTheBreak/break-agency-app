import prisma from "./lib/prisma.js";

async function main() {
  // Roles are stored as string values on User.role, not as a separate table
  // No seed data needed
  console.log("Roles configuration: String enum on User model");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());