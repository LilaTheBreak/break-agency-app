interface ReplyPromptArgs {
  threadHistory: string;
  userPersona: string; // e.g., "friendly but professional talent manager"
  objective: string; // e.g., "Politely decline the offer but keep the door open for future collaborations"
  senderName: string;
}

export function buildInboxReplyPrompt(args: ReplyPromptArgs): string {
  return `
You are an AI assistant for a ${args.userPersona}. Your task is to draft an email reply.

**Objective:** ${args.objective}.

**Conversation History:**
---
${args.threadHistory}
---

Based on the history and objective, draft a concise and effective reply to ${args.senderName}. Do not include a subject line or signature.`;
}