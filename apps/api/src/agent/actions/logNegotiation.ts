import prisma from "../../lib/prisma.js";

export default {
  name: "logNegotiation",
  async run({ deal, stepResult, user }) {
    await prisma.negotiationLog.create({
      data: {
        userId: user?.id,
        dealId: deal?.id ?? null,
        step: "negotiation",
        input: deal,
        output: stepResult
      }
    });

    return { logged: true };
  }
};
