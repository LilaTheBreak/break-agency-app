-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('NEW_LEAD', 'BRIEF_RECEIVED', 'NEGOTIATING', 'PENDING_CONTRACT', 'CONTRACT_SENT', 'LIVE', 'CONTENT_SUBMITTED', 'APPROVED', 'PAYMENT_SENT', 'CLOSED_WON', 'CLOSED_LOST');

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "summary" TEXT;

-- CreateTable
CREATE TABLE "DealThread" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "brandName" TEXT,
    "brandEmail" TEXT,
    "subjectRoot" TEXT,
    "stage" "DealStage" NOT NULL DEFAULT 'NEW_LEAD',
    "status" TEXT NOT NULL DEFAULT 'open',
    "talentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "agentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "brandId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "negotiationInsights" JSONB,

    CONSTRAINT "DealThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealThreadEmail" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "subject" TEXT,
    "snippet" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealThreadEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealEvent" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorId" TEXT,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliverableItem" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "caption" TEXT,
    "notes" TEXT,
    "fileId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "aiQA" JSONB,
    "aiPrediction" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliverableItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboundEmail" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "snippet" TEXT,
    "body" TEXT,
    "from" TEXT,
    "to" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "classification" JSONB,
    "extractedData" JSONB,
    "dealDraftId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboundEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceEmailId" TEXT,
    "brandName" TEXT,
    "opportunityType" TEXT,
    "budget" INTEGER,
    "deliverables" JSONB,
    "timeline" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domains" TEXT[],
    "emails" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DealThread_userId_idx" ON "DealThread"("userId");

-- CreateIndex
CREATE INDEX "DealThread_status_idx" ON "DealThread"("status");

-- CreateIndex
CREATE INDEX "DealThread_createdAt_idx" ON "DealThread"("createdAt");

-- CreateIndex
CREATE INDEX "DealThread_brandId_idx" ON "DealThread"("brandId");

-- CreateIndex
CREATE INDEX "DealThread_talentIds_idx" ON "DealThread"("talentIds");

-- CreateIndex
CREATE INDEX "DealThread_stage_idx" ON "DealThread"("stage");

-- CreateIndex
CREATE INDEX "DealThread_agentIds_idx" ON "DealThread"("agentIds");

-- CreateIndex
CREATE INDEX "DealThreadEmail_threadId_idx" ON "DealThreadEmail"("threadId");

-- CreateIndex
CREATE INDEX "DealThreadEmail_emailId_idx" ON "DealThreadEmail"("emailId");

-- CreateIndex
CREATE INDEX "DealThreadEmail_receivedAt_idx" ON "DealThreadEmail"("receivedAt");

-- CreateIndex
CREATE INDEX "DealEvent_dealId_idx" ON "DealEvent"("dealId");

-- CreateIndex
CREATE INDEX "DealEvent_type_idx" ON "DealEvent"("type");

-- CreateIndex
CREATE INDEX "DealEvent_createdAt_idx" ON "DealEvent"("createdAt");

-- CreateIndex
CREATE INDEX "DeliverableItem_dealId_idx" ON "DeliverableItem"("dealId");

-- CreateIndex
CREATE INDEX "DeliverableItem_status_idx" ON "DeliverableItem"("status");

-- CreateIndex
CREATE INDEX "DeliverableItem_type_idx" ON "DeliverableItem"("type");

-- CreateIndex
CREATE INDEX "InboundEmail_userId_idx" ON "InboundEmail"("userId");

-- CreateIndex
CREATE INDEX "InboundEmail_receivedAt_idx" ON "InboundEmail"("receivedAt");

-- CreateIndex
CREATE INDEX "DealDraft_userId_idx" ON "DealDraft"("userId");

-- CreateIndex
CREATE INDEX "DealDraft_status_idx" ON "DealDraft"("status");

-- AddForeignKey
ALTER TABLE "DealThread" ADD CONSTRAINT "DealThread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealThread" ADD CONSTRAINT "DealThread_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealThreadEmail" ADD CONSTRAINT "DealThreadEmail_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "DealThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealEvent" ADD CONSTRAINT "DealEvent_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "DealThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliverableItem" ADD CONSTRAINT "DeliverableItem_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "DealThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundEmail" ADD CONSTRAINT "InboundEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealDraft" ADD CONSTRAINT "DealDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
