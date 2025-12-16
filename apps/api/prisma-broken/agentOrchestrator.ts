import prisma from '../../lib/prisma.js';
import { inboxPipeline } from './pipelines/inboxPipeline.js';
import { negotiationPipeline } from './pipelines/negotiationPipeline.js';

/**
 * The central brain of the autonomous agent. It routes events to the correct pipeline.
 * @param event - The event to process, e.g., { type: 'INBOUND_EMAIL', payload: { emailId: '...' } }
 */
export async function handleAgentEvent(event: { type: string; payload: any }) {
  const { type, payload } = event;
  console.log(`[AGENT ORCHESTRATOR] Received event: ${type}`);

  const execution = await prisma.agentExecution.create({
    data: {
      userId: payload.userId || 'system', // Default to system if no user context
      eventType: type,
      pipeline: 'unknown',
      step: 'start',
      status: 'started',
      input: payload,
    },
  });

  try {
    switch (type) {
      case 'INBOUND_EMAIL':
        await inboxPipeline(payload.emailId);
        break;
      case 'DRAFT_CREATED':
        await negotiationPipeline(payload.dealDraftId);
        break;
      // Add cases for all other event types...
      // case 'CONTRACT_SIGNED':
      //   await deliverablePipeline(payload.contractId);
      //   break;
      default:
        console.warn(`[AGENT ORCHESTRATOR] No handler for event type: ${type}`);
    }
    await prisma.agentExecution.update({ where: { id: execution.id }, data: { status: 'completed', completedAt: new Date() } });
  } catch (error: any) {
    await prisma.agentExecution.update({
      where: { id: execution.id },
      data: { status: 'failed', errorMessage: error.message, completedAt: new Date() },
    });
    throw error;
  }
}