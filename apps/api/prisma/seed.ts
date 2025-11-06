import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // TODO: implement rich seed data (listings, buyers, sellers, viewings, offers, templates).
  // For now we only ensure the connection works.
  await prisma.user.upsert({
    where: { email: "agent@home.local" },
    update: {},
    create: {
      email: "agent@home.local",
      name: "Senior Agent",
      role: "AGENT"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
