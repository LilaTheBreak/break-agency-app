import { createSafeQueue } from "../queues/index.js";

export const gmailQueue = createSafeQueue("gmail-ingest");
export const socialQueue = createSafeQueue("social-refresh");
export const emailQueue = createSafeQueue("email-send");
export const triageQueue = createSafeQueue("inbox-triage");
export const dealExtractionQueue = createSafeQueue("deal-extraction");
export const negotiationQueue = createSafeQueue("negotiation-engine");
export const campaignQueue = createSafeQueue("campaign-builder");
// AI Agent — Autonomous Actions
export const aiAgentQueue = createSafeQueue("ai-agent");
export const outreachQueue = createSafeQueue("ai-outreach");
export const negotiationSessionQueue = createSafeQueue("ai-negotiation");
export const contractQueue = createSafeQueue("ai-contract");
export const deliverableQueue = createSafeQueue("deliverable-reminders");
export const agentQueue = createSafeQueue("agent-tasks");
export const contractFinalisationQueue = createSafeQueue("contract_finalisation");
export const outreachEngineQueue = createSafeQueue("outreach");
export const brandQueue = createSafeQueue("brand-crm");
export const strategyQueue = createSafeQueue("strategy-engine");
export const creatorFitQueue = createSafeQueue("creator-fit");
export const dealPackageQueue = createSafeQueue("deal-package");
export const creatorBundleQueue = createSafeQueue("creator-bundle");
export const deliverableReviewQueue = createSafeQueue("deliverable-review");
export const inboxQueue = createSafeQueue("inbox");
export const dealExtractionQueue = createSafeQueue("deal-extraction");
