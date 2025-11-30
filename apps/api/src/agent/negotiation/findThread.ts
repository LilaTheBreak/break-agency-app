import prisma from "../../lib/prisma.js";

export async function findOrCreateThread(userId: string, email: any) {
  const brandEmail = email?.from;

  let thread = await prisma.negotiationThread.findFirst({
    where: {
      userId,
      brandEmail,
      status: "active"
    }
  });

  if (!thread) {
    thread = await prisma.negotiationThread.create({
      data: {
        userId,
        brandEmail,
        brandName: email?.brandName ?? null
      }
    });
  }

  return thread;
}
