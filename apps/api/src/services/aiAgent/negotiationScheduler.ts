import prisma from "../../lib/prisma.js";
import { negotiationSessionQueue } from "../../worker/queues.js";

export async function enqueueNegotiationSession({ userId, emailData }: { userId: string; emailData: any }) {
  const fromName = emailData.from?.name || emailData.from?.email?.split("@")[0] || "Unknown";
  const brandName = emailData.brandName || fromName;
  const brandEmail = emailData.from?.email || emailData.from || null;

  const offer = {
    rate: emailData.body?.match(/£\d+/i)?.[0] || null,
    deliverables: extractDeliverables(emailData.body || ""),
    deadlines: extractDeadlines(emailData.body || "")
  };

  const session = await prisma.negotiationSession.create({
    data: {
      userId,
      brandName,
      brandEmail,
      originalEmail: emailData,
      offerDetails: offer
    }
  });

  await negotiationSessionQueue.add("nego-initial", {
    userId,
    sessionId: session.id,
    step: "initial"
  });
}

function extractDeliverables(text: string) {
  return text.match(/post|video|story|deliverable|asset/gi) || [];
}

function extractDeadlines(text: string) {
  return text.match(/\b\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i) || [];
}
