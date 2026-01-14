// apps/api/src/prompts/inboxReplyPrompt.ts

export interface InboxReplyPromptInput {
  message: string;
  context?: any;
}

export function buildInboxReplyPrompt(input: InboxReplyPromptInput) {
  const { message, context = {} } = input;
  return `You are crafting replies to this message: ${message}.
Context: ${JSON.stringify(context)}
Provide three reply styles: Friendly, Professional, and Concise. Keep each short and clear.`
    .replace(/\n/g, " ");
}
