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
  dealPackageQueue,
  creatorBundleQueue,
  deliverableReviewQueue,
  inboxQueue,
  dealExtractionQueue
} from "./queues.js";
import gmailIngestProcessor from "./processors/gmailIngestProcessor.js";
import socialRefreshProcessor from "./processors/socialRefreshProcessor.js";
import emailProcessor from "./processors/emailProcessor.js";
import triageProcessor from "./processors/triageProcessor.js";
import dealExtractionProcessor from "./processors/dealExtractionProcessor.js";
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
import dealPackageProcessor from "./processors/dealPackageProcessor.js";
import creatorBundleProcessor from "./processors/creatorBundleProcessor.js";
import deliverableReviewProcessor from "./processors/deliverableReviewProcessor.js";
import inboxProcessor from "./processors/inboxProcessor.js";
import dealExtractionWorker from './processors/dealExtractionWorker.js';
import { createSafeQueue } from "../queues/index.js";
async function main() {
  const attach = (queue: any, name: string, processor: any) => {
    if (!queue?.process) {
      console.log("[WORKER] Running in stub mode (no Redis)");
      return;
    }

    queue.process(async (job: any) => {
      try {
        return await processor(job);
      } catch (err) {
        console.error("[WORKER ERROR]", name, err);
        return null;
      }
    });
  };

  attach(gmailQueue, "gmail-ingest", gmailIngestProcessor);
  attach(socialQueue, "social-refresh", socialRefreshProcessor);
  attach(emailQueue, "email-send", emailProcessor);
  attach(triageQueue, "inbox-triage", triageProcessor);
  attach(dealExtractionQueue, "deal-extraction", dealExtractionProcessor);
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
  attach(dealPackageQueue, "deal-package", dealPackageProcessor);
  attach(creatorBundleQueue, "creator-bundle", creatorBundleProcessor);
  attach(deliverableReviewQueue, "deliverable-review", deliverableReviewProcessor);
  attach(inboxQueue, "inbox", inboxProcessor);
  attach(dealExtractionQueue, "deal-extraction", dealExtractionWorker);
  console.log(
    "Worker started. Queues: gmail-ingest, social-refresh, email-send, inbox-triage, deal-extraction, negotiation-engine, campaign-builder, ai-agent, ai-outreach, ai-negotiation, ai-contract, deliverable-reminders, agent-tasks, contract_finalisation, outreach, brand-crm, strategy-engine, creator-fit, deal-package, creator-bundle, deliverable-review, inbox, deal-extraction"
  );
}

main().catch((err) => {
  console.error("Worker failed to start", err);
  process.exit(1);
});
