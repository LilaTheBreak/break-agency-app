import {
  gmailQueue,
  socialQueue,
  emailQueue,
  triageQueue,
  dealExtractionQueue,
  negotiationQueue,
  campaignQueue,
  aiAgentQueue,
  outreachQueue,
  negotiationSessionQueue,
  contractQueue,
  deliverableQueue,
  agentQueue,
  contractFinalisationQueue,
  outreachEngineQueue,
  brandQueue,
  strategyQueue,
  creatorFitQueue,
  // Phase 3: Removed dealPackageQueue - deal packages schema removed
  creatorBundleQueue,
  deliverableReviewQueue,
  inboxQueue
} from "./queues.js";
import gmailIngestProcessor from "./processors/gmailIngestProcessor.js";
import socialRefreshProcessor from "./processors/socialRefreshProcessor.js";
import emailProcessor from "./processors/emailProcessor.js";
import triageProcessor from "./processors/triageProcessor.js";
// Phase 3: Removed dealExtractionProcessor - using dealExtractionWorker instead (has proper error handling)
import negotiationProcessor from "./processors/negotiationProcessor.js";
import campaignProcessor from "./processors/campaignProcessor.js";
import aiAgentProcessor from "./processors/aiAgentProcessor.js";
import outreachProcessor from "./processors/outreachProcessor.js";
import negotiationSessionProcessor from "./processors/negotiationSessionProcessor.js";
import contractProcessor from "./processors/contractProcessor.js";
import deliverableProcessor from "./processors/deliverableProcessor.js";
import agentProcessor from "./processors/agentProcessor.js";
import contractFinalisationProcessor from "./processors/contractFinalisationProcessor.js";
import outreachEngineProcessor from "./processors/outreachEngineProcessor.js";
import brandProcessor from "./processors/brandProcessor.js";
import strategyProcessor from "./processors/strategyProcessor.js";
import creatorFitProcessor from "./processors/creatorFitProcessor.js";
// Phase 3: Removed dealPackageProcessor - deal packages schema removed
import creatorBundleProcessor from "./processors/creatorBundleProcessor.js";
import deliverableReviewProcessor from "./processors/deliverableReviewProcessor.js";
import inboxProcessor from "./inboxProcessor.js";
import dealExtractionWorker from './processors/dealExtractionWorker.js';
import { createSafeQueue } from "../queues/index.js";
async function main() {
  // Phase 3: Updated attach function to fail loudly - errors are thrown so BullMQ can retry
  const attach = (queue: any, name: string, processor: any) => {
    if (!queue?.process) {
      console.log("[WORKER] Running in stub mode (no Redis)");
      return;
    }

    queue.process(async (job: any) => {
      try {
        const result = await processor(job);
        console.log(`[WORKER] ${name} job ${job.id} completed successfully`);
        return result;
      } catch (err) {
        // Phase 3: Fail loudly - throw error so BullMQ can retry
        console.error(`[WORKER ERROR] ${name} job ${job.id} failed:`, err);
        throw err; // Re-throw so BullMQ handles retry logic
      }
    });
  };

  attach(gmailQueue, "gmail-ingest", gmailIngestProcessor);
  attach(socialQueue, "social-refresh", socialRefreshProcessor);
  attach(emailQueue, "email-send", emailProcessor);
  attach(triageQueue, "inbox-triage", triageProcessor);
  // Phase 3: Using dealExtractionWorker (has proper error handling) instead of dealExtractionProcessor
  attach(dealExtractionQueue, "deal-extraction", dealExtractionWorker);
  attach(negotiationQueue, "negotiation-engine", negotiationProcessor);
  attach(campaignQueue, "campaign-builder", campaignProcessor);
  attach(aiAgentQueue, "ai-agent", aiAgentProcessor);
  attach(outreachQueue, "ai-outreach", outreachProcessor);
  attach(negotiationSessionQueue, "ai-negotiation", negotiationSessionProcessor);
  attach(contractQueue, "ai-contract", contractProcessor);
  attach(deliverableQueue, "deliverable-reminders", deliverableProcessor);
  attach(agentQueue, "agent-tasks", agentProcessor);
  attach(contractFinalisationQueue, "contract_finalisation", contractFinalisationProcessor);
  attach(outreachEngineQueue, "outreach", outreachEngineProcessor);
  attach(brandQueue, "brand-crm", brandProcessor);
  attach(strategyQueue, "strategy-engine", strategyProcessor);
  attach(creatorFitQueue, "creator-fit", creatorFitProcessor);
  // Phase 3: Removed dealPackageQueue - deal packages schema removed
  attach(creatorBundleQueue, "creator-bundle", creatorBundleProcessor);
  attach(deliverableReviewQueue, "deliverable-review", deliverableReviewProcessor);
  attach(inboxQueue, "inbox", inboxProcessor);
  console.log(
    "Worker started. Queues: gmail-ingest, social-refresh, email-send, inbox-triage, deal-extraction, negotiation-engine, campaign-builder, ai-agent, ai-outreach, ai-negotiation, ai-contract, deliverable-reminders, agent-tasks, contract_finalisation, outreach, brand-crm, strategy-engine, creator-fit, creator-bundle, deliverable-review, inbox"
  );
}

main().catch((err) => {
  console.error("Worker failed to start", err);
  process.exit(1);
});
