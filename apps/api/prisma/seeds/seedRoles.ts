import prisma from "../../src/lib/prisma.js";
import bcrypt from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";

async function main() {
  // Create admin user for dev testing
  const devPassword = "dev-password";
  const passwordHash = await bcrypt.hash(devPassword, 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@thebreakco.com" },
    update: { role: "ADMIN" },
    create: {
      id: createId(),
      email: "admin@thebreakco.com",
      name: "Dev Admin",
      role: "ADMIN",
      password: passwordHash,
      updatedAt: new Date(),
    },
  });

  console.log("✅ Admin user created/updated:", adminUser.email, "with role: ADMIN");
  console.log("🔑 Password: dev-password");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
