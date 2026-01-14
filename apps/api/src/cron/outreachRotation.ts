import prisma from '../lib/prisma.js';
import { enqueueAIAgentTask } from '../worker/enqueueAIAgentTask.js';

export async function runOutreachRotation() {
  // TODO: Implement outreach rotation once aiSettings and outboundTemplates are added to Talent model
  // For now, this is stubbed to prevent build errors
  return { queued: 0 };
}
