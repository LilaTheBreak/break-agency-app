/*
  Warnings:

  - You are about to drop the column `externalId` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `parties` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `brandName` on the `DealDraft` table. All the data in the column will be lost.
  - You are about to drop the column `budget` on the `DealDraft` table. All the data in the column will be lost.
  - You are about to drop the column `opportunityType` on the `DealDraft` table. All the data in the column will be lost.
  - You are about to drop the column `sourceEmailId` on the `DealDraft` table. All the data in the column will be lost.
  - You are about to drop the column `timeline` on the `DealDraft` table. All the data in the column will be lost.
  - You are about to drop the column `owner` on the `Deliverable` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Deliverable` table. All the data in the column will be lost.
  - Added the required column `terms` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `Contract` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "NegotiationStyle" AS ENUM ('AGGRESSIVE', 'BALANCED', 'COLLABORATIVE', 'PREMIUM_ONLY');

-- CreateEnum
CREATE TYPE "AIAgentTaskType" AS ENUM ('AUTO_REPLY', 'NEGOTIATION', 'OUTREACH', 'FOLLOW_UP', 'DEAL_REVIEW', 'WEEKLY_REPORT', 'ANALYSIS', 'INBOX_REPLY');

-- CreateEnum
CREATE TYPE "AIAgentTaskStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- DropForeignKey
ALTER TABLE "Contract" DROP CONSTRAINT "Contract_userId_fkey";

-- DropIndex
DROP INDEX "Deliverable_role_idx";

-- DropIndex
DROP INDEX "Deliverable_status_role_idx";

-- AlterTable
ALTER TABLE "Approval" ADD COLUMN     "campaignId" TEXT;

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aiSummary" TEXT,
ADD COLUMN     "deliverablePlan" JSONB,
ADD COLUMN     "timeline" JSONB;

-- AlterTable
ALTER TABLE "Contract" DROP COLUMN "externalId",
DROP COLUMN "fileUrl",
DROP COLUMN "metadata",
DROP COLUMN "parties",
DROP COLUMN "summary",
DROP COLUMN "title",
ADD COLUMN     "dealId" TEXT,
ADD COLUMN     "pdfUrl" TEXT,
ADD COLUMN     "terms" JSONB NOT NULL,
ADD COLUMN     "threadId" TEXT,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "DealDraft" DROP COLUMN "brandName",
DROP COLUMN "budget",
DROP COLUMN "opportunityType",
DROP COLUMN "sourceEmailId",
DROP COLUMN "timeline",
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "confidence" DOUBLE PRECISION,
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "emailId" TEXT,
ADD COLUMN     "exclusivity" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "offerType" TEXT,
ADD COLUMN     "paymentAmount" DOUBLE PRECISION,
ADD COLUMN     "rawJson" JSONB,
ADD COLUMN     "usageRights" TEXT;

-- AlterTable
ALTER TABLE "Deliverable" DROP COLUMN "owner",
DROP COLUMN "role",
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "campaignId" TEXT,
ADD COLUMN     "contractId" TEXT,
ADD COLUMN     "dealId" TEXT,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "proofFileId" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "InboundEmail" ADD COLUMN     "aiBrand" TEXT,
ADD COLUMN     "aiCategory" TEXT,
ADD COLUMN     "aiConfidence" DOUBLE PRECISION,
ADD COLUMN     "aiDeadline" TEXT,
ADD COLUMN     "aiJson" JSONB,
ADD COLUMN     "aiRecommendedAction" TEXT,
ADD COLUMN     "aiSummary" TEXT,
ADD COLUMN     "aiUrgency" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "campaignId" TEXT;

-- CreateTable
CREATE TABLE "SignatureRequest" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "signerEmail" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "envelopeId" TEXT,
    "signedPdfUrl" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignatureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "brandWebsite" TEXT,
    "brandEmail" TEXT,
    "industry" TEXT,
    "score" INTEGER NOT NULL DEFAULT 50,
    "source" TEXT NOT NULL DEFAULT 'ai-prospect',
    "status" TEXT NOT NULL DEFAULT 'new',
    "notes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachSequence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachStep" (
    "id" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "delayHours" INTEGER NOT NULL DEFAULT 48,
    "template" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachAction" (
    "id" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "stepId" TEXT,
    "actionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "runAt" TIMESTAMP(3) NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandRelationship" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "brandEmail" TEXT,
    "brandWebsite" TEXT,
    "category" TEXT,
    "region" TEXT,
    "engagements" INTEGER NOT NULL DEFAULT 0,
    "messagesSent" INTEGER NOT NULL DEFAULT 0,
    "lastContactAt" TIMESTAMP(3),
    "lastReplyAt" TIMESTAMP(3),
    "affinityScore" INTEGER NOT NULL DEFAULT 50,
    "likelihoodToClose" INTEGER NOT NULL DEFAULT 50,
    "warm" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandAffinitySnapshot" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "affinityScore" INTEGER NOT NULL,
    "likelihoodToClose" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandAffinitySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandEvent" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandSignal" (
    "id" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "brandId" TEXT,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "value" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandCampaignPrediction" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "brandName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "likelihood" INTEGER NOT NULL DEFAULT 50,
    "predictedBudget" INTEGER,
    "predictedStage" TEXT,
    "predictedStart" TIMESTAMP(3),
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "reasons" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandCampaignPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityCluster" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT,
    "region" TEXT,
    "score" INTEGER NOT NULL DEFAULT 50,
    "brands" JSONB,
    "insights" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorBrandFit" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "brandId" TEXT,
    "brandName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fitScore" INTEGER NOT NULL,
    "predictedValue" INTEGER,
    "likelihood" INTEGER,
    "confidence" INTEGER,
    "reasons" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorBrandFit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealPackage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "creatorId" TEXT,
    "campaignGoal" TEXT,
    "deliverables" JSONB NOT NULL,
    "pricing" JSONB NOT NULL,
    "concepts" JSONB NOT NULL,
    "timeline" JSONB NOT NULL,
    "terms" JSONB NOT NULL,
    "upsells" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorBundle" (
    "id" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packages" JSONB NOT NULL,
    "prediction" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorBundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandBrief" (
    "id" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "submittedBy" TEXT,
    "content" TEXT NOT NULL,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "categories" TEXT[],
    "aiSummary" JSONB,
    "aiKeywords" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BriefMatch" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "predictedFee" INTEGER,
    "predictedPerformance" JSONB,

    CONSTRAINT "BriefMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BriefRecommendation" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "bundleId" TEXT,
    "emailCopy" TEXT,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BriefRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignAutoPlan" (
    "id" TEXT NOT NULL,
    "briefId" TEXT,
    "bundleId" TEXT,
    "campaignId" TEXT,
    "createdBy" TEXT,
    "aiSummary" JSONB,
    "aiTimeline" JSONB,
    "aiBudget" JSONB,
    "aiDeliverables" JSONB,
    "aiRisks" JSONB,
    "aiContracts" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignAutoPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignTimelineItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "deliverableId" TEXT,

    CONSTRAINT "CampaignTimelineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignDeliverableAuto" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rounds" INTEGER,
    "aiNotes" TEXT,
    "dueDate" TIMESTAMP(3),

    CONSTRAINT "CampaignDeliverableAuto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliverableReview" (
    "id" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,
    "userId" TEXT,
    "aiSummary" TEXT,
    "aiIssues" JSONB,
    "aiSuggestions" JSONB,
    "aiScore" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliverableReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorInsights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "followers" INTEGER,
    "engagementRate" DOUBLE PRECISION,
    "reach" INTEGER,
    "impressions" INTEGER,
    "summary" TEXT,
    "opportunities" TEXT,
    "risks" TEXT,
    "contentIdeas" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorInsights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorWeeklyReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "insights" JSONB,
    "aiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorWeeklyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorPrediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "predictedValue" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAgentMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "topic" TEXT,
    "content" JSONB NOT NULL,
    "importance" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAgentMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandIntel" (
    "id" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "brandEmail" TEXT,
    "category" TEXT,
    "notes" JSONB,
    "metadata" JSONB,
    "history" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandIntel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InteractionHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InteractionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorPersonaProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toneKeywords" TEXT,
    "writingStyle" TEXT,
    "personaRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorPersonaProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "brandEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "score" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandName" TEXT,
    "brandEmail" TEXT,
    "subject" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileId" TEXT,
    "brandName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rawText" TEXT,
    "aiSummary" JSONB,
    "aiRisks" JSONB,
    "aiRedlines" JSONB,
    "aiDealMapping" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractTerm" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "ContractTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NegotiationSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "brandEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "originalEmail" JSONB,
    "offerDetails" JSONB,
    "aiNotes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NegotiationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NegotiationMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "threadId" TEXT,
    "sender" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NegotiationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NegotiationInsight" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dealDraftId" TEXT NOT NULL,
    "recommendedRate" DOUBLE PRECISION,
    "rateCurrency" TEXT,
    "justification" TEXT,
    "redFlags" JSONB,
    "softSignals" JSONB,
    "negotiationScript" TEXT,
    "confidence" DOUBLE PRECISION,
    "rawJson" JSONB,

    CONSTRAINT "NegotiationInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Talent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Talent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentAISettings" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "autoReply" BOOLEAN NOT NULL DEFAULT false,
    "outreachEnabled" BOOLEAN NOT NULL DEFAULT false,
    "negotiationStyle" "NegotiationStyle" NOT NULL DEFAULT 'BALANCED',
    "defaultTone" TEXT,
    "brandVoice" TEXT,
    "minRate" INTEGER,
    "preferredRate" INTEGER,
    "premiumRate" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentAISettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentPricingModel" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "deliverable" TEXT NOT NULL,
    "baseRate" INTEGER NOT NULL,
    "minRate" INTEGER,
    "maxRate" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentPricingModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AITalentMemory" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AITalentMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAgentTask" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "type" "AIAgentTaskType" NOT NULL,
    "status" "AIAgentTaskStatus" NOT NULL DEFAULT 'PENDING',
    "emailId" TEXT,
    "dealId" TEXT,
    "payload" JSONB,
    "result" JSONB,
    "scheduledFor" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAgentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAgentExecutionLog" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "talentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAgentExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAutoReplyRule" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAutoReplyRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIOutboundTemplate" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIOutboundTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIResponseLog" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "emailId" TEXT,
    "action" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIResponseLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentPolicy" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sandboxMode" BOOLEAN NOT NULL DEFAULT true,
    "maxOutreachPerDay" INTEGER NOT NULL DEFAULT 10,
    "negotiationCeilingPct" INTEGER NOT NULL DEFAULT 25,
    "autoSendNegotiation" BOOLEAN NOT NULL DEFAULT false,
    "tone" TEXT NOT NULL DEFAULT 'professional',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NegotiationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailId" TEXT,
    "dealId" TEXT,
    "step" TEXT NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NegotiationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NegotiationThread" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandEmail" TEXT NOT NULL,
    "brandName" TEXT,
    "dealId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NegotiationThread_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrandRelationship_userId_idx" ON "BrandRelationship"("userId");

-- CreateIndex
CREATE INDEX "BrandRelationship_brandName_idx" ON "BrandRelationship"("brandName");

-- CreateIndex
CREATE INDEX "BrandSignal_brandName_idx" ON "BrandSignal"("brandName");

-- CreateIndex
CREATE INDEX "BrandCampaignPrediction_brandName_idx" ON "BrandCampaignPrediction"("brandName");

-- CreateIndex
CREATE INDEX "BrandCampaignPrediction_userId_idx" ON "BrandCampaignPrediction"("userId");

-- CreateIndex
CREATE INDEX "CreatorBrandFit_creatorId_brandName_idx" ON "CreatorBrandFit"("creatorId", "brandName");

-- CreateIndex
CREATE INDEX "CreatorWeeklyReport_userId_idx" ON "CreatorWeeklyReport"("userId");

-- CreateIndex
CREATE INDEX "CreatorWeeklyReport_weekStart_idx" ON "CreatorWeeklyReport"("weekStart");

-- CreateIndex
CREATE INDEX "CreatorPrediction_userId_idx" ON "CreatorPrediction"("userId");

-- CreateIndex
CREATE INDEX "AIAgentMemory_userId_idx" ON "AIAgentMemory"("userId");

-- CreateIndex
CREATE INDEX "AIAgentMemory_type_idx" ON "AIAgentMemory"("type");

-- CreateIndex
CREATE INDEX "AIAgentMemory_topic_idx" ON "AIAgentMemory"("topic");

-- CreateIndex
CREATE INDEX "BrandIntel_brandName_idx" ON "BrandIntel"("brandName");

-- CreateIndex
CREATE INDEX "InteractionHistory_userId_idx" ON "InteractionHistory"("userId");

-- CreateIndex
CREATE INDEX "InteractionHistory_entity_idx" ON "InteractionHistory"("entity");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorPersonaProfile_userId_key" ON "CreatorPersonaProfile"("userId");

-- CreateIndex
CREATE INDEX "OutreachPlan_userId_idx" ON "OutreachPlan"("userId");

-- CreateIndex
CREATE INDEX "OutreachPlan_brandName_idx" ON "OutreachPlan"("brandName");

-- CreateIndex
CREATE INDEX "OutreachPlan_status_idx" ON "OutreachPlan"("status");

-- CreateIndex
CREATE INDEX "OutreachLog_userId_idx" ON "OutreachLog"("userId");

-- CreateIndex
CREATE INDEX "OutreachLog_brandName_idx" ON "OutreachLog"("brandName");

-- CreateIndex
CREATE INDEX "NegotiationInsight_dealDraftId_idx" ON "NegotiationInsight"("dealDraftId");

-- CreateIndex
CREATE INDEX "NegotiationInsight_createdAt_idx" ON "NegotiationInsight"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Talent_userId_key" ON "Talent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TalentAISettings_talentId_key" ON "TalentAISettings"("talentId");

-- CreateIndex
CREATE INDEX "TalentPricingModel_talentId_idx" ON "TalentPricingModel"("talentId");

-- CreateIndex
CREATE INDEX "AITalentMemory_talentId_idx" ON "AITalentMemory"("talentId");

-- CreateIndex
CREATE INDEX "AIAgentTask_talentId_idx" ON "AIAgentTask"("talentId");

-- CreateIndex
CREATE INDEX "AIAgentTask_status_idx" ON "AIAgentTask"("status");

-- CreateIndex
CREATE INDEX "AIAgentTask_type_idx" ON "AIAgentTask"("type");

-- CreateIndex
CREATE INDEX "AIAgentExecutionLog_taskId_idx" ON "AIAgentExecutionLog"("taskId");

-- CreateIndex
CREATE INDEX "AIAgentExecutionLog_talentId_idx" ON "AIAgentExecutionLog"("talentId");

-- CreateIndex
CREATE INDEX "AIAgentExecutionLog_action_idx" ON "AIAgentExecutionLog"("action");

-- CreateIndex
CREATE INDEX "AIAutoReplyRule_talentId_idx" ON "AIAutoReplyRule"("talentId");

-- CreateIndex
CREATE INDEX "AIOutboundTemplate_talentId_idx" ON "AIOutboundTemplate"("talentId");

-- CreateIndex
CREATE INDEX "AIResponseLog_talentId_idx" ON "AIResponseLog"("talentId");

-- CreateIndex
CREATE INDEX "AIResponseLog_action_idx" ON "AIResponseLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "AgentPolicy_userId_key" ON "AgentPolicy"("userId");

-- CreateIndex
CREATE INDEX "NegotiationLog_userId_idx" ON "NegotiationLog"("userId");

-- CreateIndex
CREATE INDEX "NegotiationLog_dealId_idx" ON "NegotiationLog"("dealId");

-- CreateIndex
CREATE INDEX "DealDraft_emailId_idx" ON "DealDraft"("emailId");

-- CreateIndex
CREATE INDEX "Deliverable_userId_idx" ON "Deliverable"("userId");

-- CreateIndex
CREATE INDEX "Deliverable_status_idx" ON "Deliverable"("status");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_proofFileId_fkey" FOREIGN KEY ("proofFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ContractReview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureRequest" ADD CONSTRAINT "SignatureRequest_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachSequence" ADD CONSTRAINT "OutreachSequence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachSequence" ADD CONSTRAINT "OutreachSequence_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachStep" ADD CONSTRAINT "OutreachStep_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "OutreachSequence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachAction" ADD CONSTRAINT "OutreachAction_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "OutreachSequence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandRelationship" ADD CONSTRAINT "BrandRelationship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandAffinitySnapshot" ADD CONSTRAINT "BrandAffinitySnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandAffinitySnapshot" ADD CONSTRAINT "BrandAffinitySnapshot_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BrandRelationship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandEvent" ADD CONSTRAINT "BrandEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandEvent" ADD CONSTRAINT "BrandEvent_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BrandRelationship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandSignal" ADD CONSTRAINT "BrandSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandCampaignPrediction" ADD CONSTRAINT "BrandCampaignPrediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityCluster" ADD CONSTRAINT "OpportunityCluster_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorBrandFit" ADD CONSTRAINT "CreatorBrandFit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealPackage" ADD CONSTRAINT "DealPackage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealPackage" ADD CONSTRAINT "DealPackage_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorBundle" ADD CONSTRAINT "CreatorBundle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefMatch" ADD CONSTRAINT "BriefMatch_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "BrandBrief"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefMatch" ADD CONSTRAINT "BriefMatch_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefRecommendation" ADD CONSTRAINT "BriefRecommendation_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "BrandBrief"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignAutoPlan" ADD CONSTRAINT "CampaignAutoPlan_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "BrandBrief"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignTimelineItem" ADD CONSTRAINT "CampaignTimelineItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "CampaignAutoPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignDeliverableAuto" ADD CONSTRAINT "CampaignDeliverableAuto_planId_fkey" FOREIGN KEY ("planId") REFERENCES "CampaignAutoPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliverableReview" ADD CONSTRAINT "DeliverableReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliverableReview" ADD CONSTRAINT "DeliverableReview_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "CampaignDeliverableAuto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorInsights" ADD CONSTRAINT "CreatorInsights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorWeeklyReport" ADD CONSTRAINT "CreatorWeeklyReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorPrediction" ADD CONSTRAINT "CreatorPrediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAgentMemory" ADD CONSTRAINT "AIAgentMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteractionHistory" ADD CONSTRAINT "InteractionHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorPersonaProfile" ADD CONSTRAINT "CreatorPersonaProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachPlan" ADD CONSTRAINT "OutreachPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractReview" ADD CONSTRAINT "ContractReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractReview" ADD CONSTRAINT "ContractReview_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractTerm" ADD CONSTRAINT "ContractTerm_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ContractReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationSession" ADD CONSTRAINT "NegotiationSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationMessage" ADD CONSTRAINT "NegotiationMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NegotiationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationMessage" ADD CONSTRAINT "NegotiationMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "NegotiationThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealDraft" ADD CONSTRAINT "DealDraft_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "InboundEmail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationInsight" ADD CONSTRAINT "NegotiationInsight_dealDraftId_fkey" FOREIGN KEY ("dealDraftId") REFERENCES "DealDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Talent" ADD CONSTRAINT "Talent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentAISettings" ADD CONSTRAINT "TalentAISettings_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentPricingModel" ADD CONSTRAINT "TalentPricingModel_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AITalentMemory" ADD CONSTRAINT "AITalentMemory_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAgentTask" ADD CONSTRAINT "AIAgentTask_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAgentExecutionLog" ADD CONSTRAINT "AIAgentExecutionLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AIAgentTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAgentExecutionLog" ADD CONSTRAINT "AIAgentExecutionLog_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAutoReplyRule" ADD CONSTRAINT "AIAutoReplyRule_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIOutboundTemplate" ADD CONSTRAINT "AIOutboundTemplate_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIResponseLog" ADD CONSTRAINT "AIResponseLog_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentPolicy" ADD CONSTRAINT "AgentPolicy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationThread" ADD CONSTRAINT "NegotiationThread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
