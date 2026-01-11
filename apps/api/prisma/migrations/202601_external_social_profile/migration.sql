-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('NEW_LEAD', 'NEGOTIATION', 'CONTRACT_SENT', 'CONTRACT_SIGNED', 'DELIVERABLES_IN_PROGRESS', 'PAYMENT_PENDING', 'PAYMENT_RECEIVED', 'COMPLETED', 'LOST');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('TEMPLATE', 'GUIDE', 'ARTICLE', 'WEBINAR', 'EVENT');

-- CreateEnum
CREATE TYPE "ResourceVisibility" AS ENUM ('PUBLIC', 'PROTECTED');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'X', 'LINKEDIN', 'FACEBOOK', 'GMAIL');

-- CreateEnum
CREATE TYPE "PageRoleScope" AS ENUM ('PUBLIC', 'CREATOR', 'FOUNDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('HERO', 'TEXT', 'IMAGE', 'SPLIT', 'ANNOUNCEMENT', 'SPACER');

-- CreateTable
CREATE TABLE "AIAgentTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAgentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "userRole" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIPromptHistory" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "category" TEXT,
    "helpful" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIPromptHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentType" TEXT,
    "bio" TEXT,
    "languages" TEXT[],
    "timezone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "maxCapacity" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "AgentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentPolicy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestorId" TEXT NOT NULL,
    "approverId" TEXT,
    "ownerId" TEXT,
    "attachments" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTokenLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "estimatedCost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiTokenLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetGeneration" (
    "id" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "type" TEXT,
    "prompt" TEXT NOT NULL,
    "generatedUrl" TEXT,
    "aiOutput" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "websiteUrl" TEXT,
    "industry" TEXT,
    "values" TEXT[],
    "restrictedCategories" TEXT[],
    "preferredCreatorTypes" TEXT[],
    "targetAudience" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandCampaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'PLANNING',
    "brands" JSONB,
    "creatorTeams" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignBrandPivot" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "metrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignBrandPivot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileId" TEXT,
    "contractText" TEXT NOT NULL,
    "findings" JSONB,
    "riskScore" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "brandId" TEXT,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT,
    "pdfUrl" TEXT,
    "signedPdfUrl" TEXT,
    "envelopeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "talentSignedAt" TIMESTAMP(3),
    "brandSignedAt" TIMESTAMP(3),
    "fullySignedAt" TIMESTAMP(3),
    "terms" JSONB,
    "templateId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "available" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availableAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "metadata" JSONB,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'internal',
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "relatedBrandIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedCreatorIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedDealIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedCampaignIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedTaskIds" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalQueueTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "dueDate" TIMESTAMP(3),
    "assignedToUserId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB DEFAULT '{}',

    CONSTRAINT "InternalQueueTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorEvent" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'suggested',
    "source" TEXT NOT NULL DEFAULT 'agent',
    "sourceUserId" TEXT,
    "declineReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorGoal" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "goalCategory" TEXT NOT NULL DEFAULT 'growth',
    "goalType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "targetUnit" TEXT,
    "timeframe" TEXT,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorGoalVersion" (
    "id" TEXT NOT NULL,
    "creatorGoalId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,

    CONSTRAINT "CreatorGoalVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorInsight" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "insightType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "context" TEXT,
    "metadata" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "CreatorInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorTask" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "taskType" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "linkedDealId" TEXT,
    "linkedDeliverableId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmBrand" (
    "id" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT NOT NULL DEFAULT 'Other',
    "status" TEXT NOT NULL DEFAULT 'Prospect',
    "owner" TEXT,
    "internalNotes" TEXT,
    "activity" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "lastActivityAt" TIMESTAMP(3),
    "lastActivityLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lifecycleStage" TEXT,
    "logo" TEXT,
    "logoUrl" TEXT,
    "about" TEXT,
    "socialLinks" JSONB,
    "enrichedAt" TIMESTAMP(3),
    "enrichmentSource" TEXT,
    "primaryContactId" TEXT,
    "relationshipStrength" TEXT,

    CONSTRAINT "CrmBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmBrandContact" (
    "id" TEXT NOT NULL,
    "crmBrandId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,
    "primaryContact" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmBrandContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmCampaign" (
    "id" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "campaignType" TEXT NOT NULL DEFAULT 'Other',
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "internalSummary" TEXT,
    "goals" TEXT,
    "keyNotes" TEXT,
    "owner" TEXT,
    "linkedDealIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "linkedTalentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "linkedTaskIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "linkedOutreachIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "linkedEventIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "activity" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "lastActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "dueDate" TIMESTAMP(3),
    "owner" TEXT,
    "brandId" TEXT,
    "dealId" TEXT,
    "campaignId" TEXT,
    "eventId" TEXT,
    "contractId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignedUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "mentions" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "ownerId" TEXT,
    "relatedBrands" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedCampaigns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedContracts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedCreators" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedDeals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedEvents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedUsers" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "CrmTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "stage" "DealStage" NOT NULL DEFAULT 'NEW_LEAD',
    "value" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "brandName" TEXT,
    "campaignName" TEXT,
    "aiSummary" TEXT,
    "notes" TEXT,
    "internalNotes" TEXT,
    "expectedClose" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "platforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deliverables" TEXT,
    "invoiceStatus" TEXT,
    "paymentStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "campaignLiveAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "contractReceivedAt" TIMESTAMP(3),
    "contractSignedAt" TIMESTAMP(3),
    "deliverablesCompletedAt" TIMESTAMP(3),
    "negotiationStartedAt" TIMESTAMP(3),
    "proposalSentAt" TIMESTAMP(3),
    "opportunityId" TEXT,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealNegotiation" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "offerTerms" JSONB,
    "counterTerms" JSONB,
    "history" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealNegotiation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealTimeline" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deliverable" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deliverableType" TEXT,
    "usageRights" TEXT,
    "frequency" TEXT,
    "dueAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliverableItem" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deliverableType" TEXT,
    "platform" TEXT,
    "usageRights" TEXT,
    "frequency" TEXT,
    "dueDate" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "locked" BOOLEAN DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliverableItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailOpportunityId" TEXT NOT NULL,
    "isRelevant" BOOLEAN NOT NULL,
    "category" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailOpportunity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gmailMessageId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "brandName" TEXT,
    "opportunityType" TEXT,
    "deliverables" JSONB,
    "dates" TEXT,
    "location" TEXT,
    "paymentDetails" TEXT,
    "contactEmail" TEXT,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "isRelevant" BOOLEAN,
    "emailBody" TEXT,
    "suggestedActions" JSONB,
    "lastActionAt" TIMESTAMP(3),
    "lastActionType" TEXT,
    "responseNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "key" TEXT NOT NULL,
    "url" TEXT,
    "filename" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "folder" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceActivityLog" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "metadata" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceDocument" (
    "id" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "fileType" TEXT NOT NULL,
    "linkedType" TEXT NOT NULL,
    "linkedId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceReconciliation" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "method" TEXT,
    "notes" TEXT,
    "confirmedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GmailToken" (
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "scope" TEXT,
    "tokenType" TEXT,
    "idToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "lastErrorAt" TIMESTAMP(3),
    "webhookExpiration" TIMESTAMP(3),
    "webhookHistoryId" TEXT,

    CONSTRAINT "GmailToken_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "GoogleAccount" (
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "tokenType" TEXT,
    "idToken" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleAccount_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "InboundEmail" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "inboxMessageId" TEXT,
    "platform" TEXT NOT NULL DEFAULT 'gmail',
    "fromEmail" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "gmailId" TEXT,
    "instagramId" TEXT,
    "tiktokId" TEXT,
    "whatsappId" TEXT,
    "threadId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "direction" TEXT NOT NULL DEFAULT 'inbound',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "categories" TEXT[],
    "metadata" JSONB,
    "aiSummary" TEXT,
    "aiCategory" TEXT,
    "aiUrgency" TEXT,
    "aiRecommendedAction" TEXT,
    "aiConfidence" DOUBLE PRECISION,
    "aiJson" JSONB,
    "snippet" TEXT,
    "dealId" TEXT,
    "talentId" TEXT,
    "brandId" TEXT,

    CONSTRAINT "InboundEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboxMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'gmail',
    "subject" TEXT,
    "snippet" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "participants" TEXT[],
    "body" TEXT,
    "parsed" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sender" TEXT,

    CONSTRAINT "InboxMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboxThreadMeta" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aiThreadSummary" TEXT,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3),
    "linkedDealId" TEXT,

    CONSTRAINT "InboxThreadMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "brandId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "invoiceNumber" TEXT NOT NULL,
    "externalId" TEXT,
    "xeroId" TEXT,
    "xeroSyncError" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "provider" TEXT,
    "userId" TEXT,
    "brandEmail" TEXT,
    "brandName" TEXT,
    "processedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "brandEmail" TEXT,
    "name" TEXT,
    "brandName" TEXT,
    "company" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "type" TEXT NOT NULL,
    "entityId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "deliverables" TEXT NOT NULL,
    "payment" TEXT NOT NULL,
    "deadline" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Live brief · Login required to apply',
    "image" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityApplication" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "pitch" TEXT,
    "proposedRate" DOUBLE PRECISION,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "OpportunityApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outreach" (
    "id" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Brand',
    "contact" TEXT,
    "contactEmail" TEXT,
    "link" TEXT,
    "owner" TEXT,
    "source" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'not-started',
    "status" TEXT NOT NULL DEFAULT 'Not started',
    "summary" TEXT,
    "threadUrl" TEXT,
    "gmailThreadId" TEXT,
    "emailsSent" INTEGER NOT NULL DEFAULT 0,
    "emailsReplies" INTEGER NOT NULL DEFAULT 0,
    "lastContact" TIMESTAMP(3),
    "nextFollowUp" TIMESTAMP(3),
    "reminder" TEXT,
    "opportunityRef" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "linkedCreatorId" TEXT,
    "linkedBrandId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "linkedCrmBrandId" TEXT,

    CONSTRAINT "Outreach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachAction" (
    "id" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "stepId" TEXT,
    "leadId" TEXT,
    "actionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "runAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachEmailThread" (
    "id" TEXT NOT NULL,
    "outreachId" TEXT NOT NULL,
    "gmailThreadId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'awaiting_reply',
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachEmailThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachNote" (
    "id" TEXT NOT NULL,
    "outreachId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachSequence" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachStep" (
    "id" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "actionType" TEXT NOT NULL,
    "delay" INTEGER,
    "template" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachTask" (
    "id" TEXT NOT NULL,
    "outreachId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "owner" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "talentId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expectedPaymentDate" TIMESTAMP(3),
    "actualPaymentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currency" TEXT DEFAULT 'usd',
    "metadata" JSONB,
    "stripePaymentIntentId" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "talentId" TEXT NOT NULL,
    "agentId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payoutId" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "referenceId" TEXT,
    "creatorId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "brandId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expectedPayoutAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "longDescription" TEXT,
    "resourceType" "ResourceType" NOT NULL,
    "uploadUrl" TEXT,
    "externalUrl" TEXT,
    "thumbnailUrl" TEXT,
    "status" "ResourceStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "ResourceVisibility" NOT NULL DEFAULT 'PUBLIC',
    "allowedAudiences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "eventDate" TIMESTAMP(3),
    "eventTime" TEXT,
    "hasReplay" BOOLEAN,
    "rsvpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rsvpOpen" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "uploadFilename" TEXT,
    "uploadFileType" TEXT,
    "uploadFileSize" INTEGER,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceRsvp" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceRsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "riskFlags" TEXT[],
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOpportunity" (
    "id" TEXT NOT NULL,
    "outreachId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "expectedCloseAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignatureRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contractId" TEXT,
    "documentUrl" TEXT NOT NULL,
    "signerEmail" TEXT NOT NULL,
    "signedPdfUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "signedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignatureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAccountConnection" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "profileUrl" TEXT,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "connectionType" TEXT NOT NULL DEFAULT 'MANUAL',
    "syncStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "syncError" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccountConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialProfile" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT,
    "bio" TEXT,
    "profileImageUrl" TEXT,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "followingCount" INTEGER,
    "postCount" INTEGER,
    "averageViews" DOUBLE PRECISION,
    "averageEngagement" DOUBLE PRECISION,
    "engagementRate" DOUBLE PRECISION,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "externalId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "caption" TEXT,
    "mediaType" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "thumbnailUrl" TEXT,
    "permalink" TEXT,
    "viewCount" INTEGER,
    "likeCount" INTEGER,
    "commentCount" INTEGER,
    "shareCount" INTEGER,
    "saveCount" INTEGER,
    "engagementRate" DOUBLE PRECISION,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMetric" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialSyncLog" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "itemsSynced" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "rateLimitHit" BOOLEAN NOT NULL DEFAULT false,
    "rateLimitReset" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalSocialProfile" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "snapshotJson" TEXT NOT NULL,
    "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalSocialProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "title" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "contentUrl" TEXT,
    "files" JSONB,
    "revisions" JSONB,
    "feedback" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuitabilityResult" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "flags" TEXT[],
    "categories" TEXT[],
    "reasoning" JSONB,
    "aiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuitabilityResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Talent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "legalName" TEXT,
    "primaryEmail" TEXT,
    "representationType" TEXT,
    "status" TEXT,
    "managerId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "notes" TEXT,
    "categories" TEXT[],
    "stage" TEXT,
    "profileImageUrl" TEXT,
    "profileImageSource" TEXT NOT NULL DEFAULT 'initials',
    "lastProfileImageSyncAt" TIMESTAMP(3),
    "socialIntelligenceNotes" TEXT,
    "analyticsNotes" TEXT,
    "comparisonNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Talent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentEmail" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "label" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentManagerAssignment" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SECONDARY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentManagerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentTask" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TalentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentSocial" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "handle" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "followers" INTEGER,
    "following" INTEGER,
    "postCount" INTEGER,
    "displayName" TEXT,
    "profileImageUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "lastScrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentSocial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentAssignment" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TalentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentUserAccess" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentUserAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingPixelEvent" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,

    CONSTRAINT "TrackingPixelEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailClickEvent" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkUrl" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,

    CONSTRAINT "EmailClickEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accountType" TEXT,
    "admin_notes" TEXT,
    "bio" TEXT,
    "creator_score" INTEGER,
    "creator_score_reason" JSONB,
    "friends_of_house_id" TEXT,
    "include_in_roster" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "managedTalentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "onboardingComplete" BOOLEAN DEFAULT false,
    "onboardingSkippedAt" TIMESTAMP(3),
    "onboarding_responses" JSONB,
    "onboarding_status" TEXT DEFAULT 'pending_review',
    "pronouns" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CREATOR',
    "role_recommended" TEXT,
    "roster_category" TEXT,
    "socialLinks" JSONB,
    "status" TEXT,
    "subscriptionStatus" TEXT DEFAULT 'free',
    "timezone" TEXT,
    "ugcApproved" BOOLEAN NOT NULL DEFAULT false,
    "ugcRates" JSONB,
    "ugc_categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ugc_portfolio_url" TEXT,
    "upgrade_suggested" BOOLEAN DEFAULT false,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WellnessCheckin" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "energyLevel" INTEGER NOT NULL,
    "workload" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WellnessCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XeroConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "XeroConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "webhookUrl" TEXT,
    "workspaceId" TEXT,
    "workspaceName" TEXT,
    "metadata" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandSavedTalent" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'saved',
    "notes" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandSavedTalent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandBrief" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deliverables" TEXT[],
    "budget" TEXT,
    "deadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdBy" TEXT NOT NULL,
    "versionHistory" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BriefMatch" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BriefMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachLead" (
    "id" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "website" TEXT,
    "industry" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "source" TEXT,
    "notes" TEXT,
    "convertedToOutreachId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorWeeklyReport" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "summary" TEXT,
    "metrics" JSONB,
    "highlights" TEXT[],
    "challenges" TEXT[],
    "nextWeekGoals" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorWeeklyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealIntelligence" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "summary" TEXT,
    "riskFlags" TEXT[],
    "performanceNotes" TEXT[],
    "insights" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealIntelligence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bundle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceMin" DOUBLE PRECISION,
    "priceMax" DOUBLE PRECISION,
    "deliverables" JSONB,
    "dealId" TEXT,
    "creatorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorFitScore" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "campaignId" TEXT,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "audienceScore" INTEGER NOT NULL DEFAULT 0,
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "historyScore" INTEGER NOT NULL DEFAULT 0,
    "categoryScore" INTEGER NOT NULL DEFAULT 0,
    "explanation" TEXT,
    "calculationDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorFitScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "roleScope" "PageRoleScope" NOT NULL DEFAULT 'PUBLIC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageBlock" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "blockType" "BlockType" NOT NULL,
    "contentJson" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageBlockDraft" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "blockId" TEXT,
    "blockType" "BlockType" NOT NULL,
    "contentJson" JSONB NOT NULL,
    "order" INTEGER NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageBlockDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UGCRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "brief" TEXT,
    "budget" DOUBLE PRECISION,
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UGCRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dealId" TEXT,
    "data" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targets" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandIntelligence" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "insights" JSONB,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandIntelligence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NegotiationInsight" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "insight" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NegotiationInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UGCListing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "rate" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UGCListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reconciliation" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueSource" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "externalAccountId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONNECTED',
    "apiKeyHash" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "syncError" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueEvent" (
    "id" TEXT NOT NULL,
    "revenueSourceId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "type" TEXT NOT NULL,
    "sourceReference" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueGoal" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "goalType" TEXT NOT NULL,
    "platform" TEXT,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "timeframe" JSONB NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDashboardConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dashboardType" TEXT NOT NULL,
    "snapshots" JSONB NOT NULL,
    "customizations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDashboardConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandUser" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "invitedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "permissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditSource" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    "lastCheckedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityConnection" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "accountHandle" TEXT,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityMetric" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "data" JSONB,
    "period" TEXT NOT NULL DEFAULT 'week',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportSchedule" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'weekly',
    "dayOfWeek" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastExportAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExportSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIAgentTask_status_idx" ON "AIAgentTask"("status");

-- CreateIndex
CREATE INDEX "AIAgentTask_taskType_idx" ON "AIAgentTask"("taskType");

-- CreateIndex
CREATE INDEX "AIAgentTask_userId_idx" ON "AIAgentTask"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userRole_action_idx" ON "AuditLog"("userRole", "action");

-- CreateIndex
CREATE INDEX "AIPromptHistory_category_idx" ON "AIPromptHistory"("category");

-- CreateIndex
CREATE INDEX "AIPromptHistory_creatorId_createdAt_idx" ON "AIPromptHistory"("creatorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentProfile_userId_key" ON "AgentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentPolicy_userId_key" ON "AgentPolicy"("userId");

-- CreateIndex
CREATE INDEX "AgentPolicy_userId_idx" ON "AgentPolicy"("userId");

-- CreateIndex
CREATE INDEX "Approval_status_idx" ON "Approval"("status");

-- CreateIndex
CREATE INDEX "Approval_type_idx" ON "Approval"("type");

-- CreateIndex
CREATE INDEX "Approval_requestorId_idx" ON "Approval"("requestorId");

-- CreateIndex
CREATE INDEX "Approval_approverId_idx" ON "Approval"("approverId");

-- CreateIndex
CREATE INDEX "AssetGeneration_deliverableId_idx" ON "AssetGeneration"("deliverableId");

-- CreateIndex
CREATE INDEX "AssetGeneration_status_idx" ON "AssetGeneration"("status");

-- CreateIndex
CREATE INDEX "AssetGeneration_userId_idx" ON "AssetGeneration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_domain_key" ON "Brand"("domain");

-- CreateIndex
CREATE INDEX "Brand_domain_idx" ON "Brand"("domain");

-- CreateIndex
CREATE INDEX "Brand_createdAt_idx" ON "Brand"("createdAt");

-- CreateIndex
CREATE INDEX "BrandCampaign_createdAt_idx" ON "BrandCampaign"("createdAt");

-- CreateIndex
CREATE INDEX "BrandCampaign_ownerId_idx" ON "BrandCampaign"("ownerId");

-- CreateIndex
CREATE INDEX "BrandCampaign_stage_idx" ON "BrandCampaign"("stage");

-- CreateIndex
CREATE INDEX "CampaignBrandPivot_brandId_idx" ON "CampaignBrandPivot"("brandId");

-- CreateIndex
CREATE INDEX "CampaignBrandPivot_campaignId_idx" ON "CampaignBrandPivot"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignBrandPivot_campaignId_brandId_key" ON "CampaignBrandPivot"("campaignId", "brandId");

-- CreateIndex
CREATE INDEX "ContractReview_fileId_idx" ON "ContractReview"("fileId");

-- CreateIndex
CREATE INDEX "ContractReview_status_idx" ON "ContractReview"("status");

-- CreateIndex
CREATE INDEX "ContractReview_userId_idx" ON "ContractReview"("userId");

-- CreateIndex
CREATE INDEX "Contract_dealId_idx" ON "Contract"("dealId");

-- CreateIndex
CREATE INDEX "Contract_brandId_idx" ON "Contract"("brandId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Contract_sentAt_idx" ON "Contract"("sentAt");

-- CreateIndex
CREATE INDEX "Contract_envelopeId_idx" ON "Contract"("envelopeId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorBalance_userId_key" ON "CreatorBalance"("userId");

-- CreateIndex
CREATE INDEX "CreatorBalance_userId_idx" ON "CreatorBalance"("userId");

-- CreateIndex
CREATE INDEX "CalendarEvent_createdBy_idx" ON "CalendarEvent"("createdBy");

-- CreateIndex
CREATE INDEX "CalendarEvent_startAt_idx" ON "CalendarEvent"("startAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_endAt_idx" ON "CalendarEvent"("endAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_type_idx" ON "CalendarEvent"("type");

-- CreateIndex
CREATE INDEX "CalendarEvent_source_idx" ON "CalendarEvent"("source");

-- CreateIndex
CREATE INDEX "CalendarEvent_status_idx" ON "CalendarEvent"("status");

-- CreateIndex
CREATE INDEX "InternalQueueTask_createdByUserId_idx" ON "InternalQueueTask"("createdByUserId");

-- CreateIndex
CREATE INDEX "InternalQueueTask_assignedToUserId_idx" ON "InternalQueueTask"("assignedToUserId");

-- CreateIndex
CREATE INDEX "InternalQueueTask_status_idx" ON "InternalQueueTask"("status");

-- CreateIndex
CREATE INDEX "InternalQueueTask_dueDate_idx" ON "InternalQueueTask"("dueDate");

-- CreateIndex
CREATE INDEX "InternalQueueTask_priority_idx" ON "InternalQueueTask"("priority");

-- CreateIndex
CREATE INDEX "CreatorEvent_creatorId_status_idx" ON "CreatorEvent"("creatorId", "status");

-- CreateIndex
CREATE INDEX "CreatorEvent_startAt_idx" ON "CreatorEvent"("startAt");

-- CreateIndex
CREATE INDEX "CreatorEvent_status_idx" ON "CreatorEvent"("status");

-- CreateIndex
CREATE INDEX "CreatorGoal_creatorId_active_idx" ON "CreatorGoal"("creatorId", "active");

-- CreateIndex
CREATE INDEX "CreatorGoal_goalCategory_idx" ON "CreatorGoal"("goalCategory");

-- CreateIndex
CREATE INDEX "CreatorGoal_goalType_idx" ON "CreatorGoal"("goalType");

-- CreateIndex
CREATE INDEX "CreatorGoalVersion_changedBy_idx" ON "CreatorGoalVersion"("changedBy");

-- CreateIndex
CREATE INDEX "CreatorGoalVersion_creatorGoalId_changedAt_idx" ON "CreatorGoalVersion"("creatorGoalId", "changedAt");

-- CreateIndex
CREATE INDEX "CreatorInsight_creatorId_createdAt_idx" ON "CreatorInsight"("creatorId", "createdAt");

-- CreateIndex
CREATE INDEX "CreatorInsight_creatorId_isRead_idx" ON "CreatorInsight"("creatorId", "isRead");

-- CreateIndex
CREATE INDEX "CreatorInsight_insightType_idx" ON "CreatorInsight"("insightType");

-- CreateIndex
CREATE INDEX "CreatorTask_creatorId_dueAt_idx" ON "CreatorTask"("creatorId", "dueAt");

-- CreateIndex
CREATE INDEX "CreatorTask_creatorId_status_idx" ON "CreatorTask"("creatorId", "status");

-- CreateIndex
CREATE INDEX "CreatorTask_linkedDealId_idx" ON "CreatorTask"("linkedDealId");

-- CreateIndex
CREATE INDEX "CreatorTask_priority_idx" ON "CreatorTask"("priority");

-- CreateIndex
CREATE INDEX "CrmBrand_brandName_idx" ON "CrmBrand"("brandName");

-- CreateIndex
CREATE INDEX "CrmBrand_status_idx" ON "CrmBrand"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CrmBrand_brandName_key" ON "CrmBrand"("brandName");

-- CreateIndex
CREATE INDEX "CrmBrandContact_crmBrandId_idx" ON "CrmBrandContact"("crmBrandId");

-- CreateIndex
CREATE INDEX "CrmBrandContact_email_idx" ON "CrmBrandContact"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CrmBrandContact_email_key" ON "CrmBrandContact"("email");

-- CreateIndex
CREATE INDEX "CrmCampaign_brandId_idx" ON "CrmCampaign"("brandId");

-- CreateIndex
CREATE INDEX "CrmCampaign_lastActivityAt_idx" ON "CrmCampaign"("lastActivityAt");

-- CreateIndex
CREATE INDEX "CrmCampaign_owner_idx" ON "CrmCampaign"("owner");

-- CreateIndex
CREATE INDEX "CrmCampaign_status_idx" ON "CrmCampaign"("status");

-- CreateIndex
CREATE INDEX "CrmTask_brandId_idx" ON "CrmTask"("brandId");

-- CreateIndex
CREATE INDEX "CrmTask_campaignId_idx" ON "CrmTask"("campaignId");

-- CreateIndex
CREATE INDEX "CrmTask_contractId_idx" ON "CrmTask"("contractId");

-- CreateIndex
CREATE INDEX "CrmTask_createdBy_idx" ON "CrmTask"("createdBy");

-- CreateIndex
CREATE INDEX "CrmTask_dealId_idx" ON "CrmTask"("dealId");

-- CreateIndex
CREATE INDEX "CrmTask_dueDate_idx" ON "CrmTask"("dueDate");

-- CreateIndex
CREATE INDEX "CrmTask_eventId_idx" ON "CrmTask"("eventId");

-- CreateIndex
CREATE INDEX "CrmTask_owner_idx" ON "CrmTask"("owner");

-- CreateIndex
CREATE INDEX "CrmTask_ownerId_idx" ON "CrmTask"("ownerId");

-- CreateIndex
CREATE INDEX "CrmTask_priority_idx" ON "CrmTask"("priority");

-- CreateIndex
CREATE INDEX "CrmTask_status_idx" ON "CrmTask"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_opportunityId_key" ON "Deal"("opportunityId");

-- CreateIndex
CREATE INDEX "Deal_opportunityId_idx" ON "Deal"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "DealNegotiation_dealId_key" ON "DealNegotiation"("dealId");

-- CreateIndex
CREATE INDEX "DeliverableItem_dealId_idx" ON "DeliverableItem"("dealId");

-- CreateIndex
CREATE INDEX "DeliverableItem_status_idx" ON "DeliverableItem"("status");

-- CreateIndex
CREATE INDEX "DeliverableItem_userId_idx" ON "DeliverableItem"("userId");

-- CreateIndex
CREATE INDEX "EmailFeedback_emailOpportunityId_idx" ON "EmailFeedback"("emailOpportunityId");

-- CreateIndex
CREATE INDEX "EmailFeedback_userId_idx" ON "EmailFeedback"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailOpportunity_gmailMessageId_key" ON "EmailOpportunity"("gmailMessageId");

-- CreateIndex
CREATE INDEX "EmailOpportunity_isUrgent_idx" ON "EmailOpportunity"("isUrgent");

-- CreateIndex
CREATE INDEX "EmailOpportunity_receivedAt_idx" ON "EmailOpportunity"("receivedAt");

-- CreateIndex
CREATE INDEX "EmailOpportunity_userId_category_idx" ON "EmailOpportunity"("userId", "category");

-- CreateIndex
CREATE INDEX "EmailOpportunity_userId_status_idx" ON "EmailOpportunity"("userId", "status");

-- CreateIndex
CREATE INDEX "File_folder_idx" ON "File"("folder");

-- CreateIndex
CREATE INDEX "File_userId_idx" ON "File"("userId");

-- CreateIndex
CREATE INDEX "FinanceActivityLog_actionType_idx" ON "FinanceActivityLog"("actionType");

-- CreateIndex
CREATE INDEX "FinanceActivityLog_createdAt_idx" ON "FinanceActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "FinanceActivityLog_referenceId_idx" ON "FinanceActivityLog"("referenceId");

-- CreateIndex
CREATE INDEX "FinanceActivityLog_referenceType_idx" ON "FinanceActivityLog"("referenceType");

-- CreateIndex
CREATE INDEX "FinanceDocument_linkedId_idx" ON "FinanceDocument"("linkedId");

-- CreateIndex
CREATE INDEX "FinanceDocument_linkedType_idx" ON "FinanceDocument"("linkedType");

-- CreateIndex
CREATE INDEX "FinanceDocument_uploadedBy_idx" ON "FinanceDocument"("uploadedBy");

-- CreateIndex
CREATE INDEX "FinanceReconciliation_confirmedAt_idx" ON "FinanceReconciliation"("confirmedAt");

-- CreateIndex
CREATE INDEX "FinanceReconciliation_referenceId_idx" ON "FinanceReconciliation"("referenceId");

-- CreateIndex
CREATE INDEX "FinanceReconciliation_type_idx" ON "FinanceReconciliation"("type");

-- CreateIndex
CREATE INDEX "GoogleAccount_email_idx" ON "GoogleAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "InboundEmail_gmailId_key" ON "InboundEmail"("gmailId");

-- CreateIndex
CREATE UNIQUE INDEX "InboundEmail_instagramId_key" ON "InboundEmail"("instagramId");

-- CreateIndex
CREATE UNIQUE INDEX "InboundEmail_tiktokId_key" ON "InboundEmail"("tiktokId");

-- CreateIndex
CREATE UNIQUE INDEX "InboundEmail_whatsappId_key" ON "InboundEmail"("whatsappId");

-- CreateIndex
CREATE INDEX "InboundEmail_receivedAt_idx" ON "InboundEmail"("receivedAt");

-- CreateIndex
CREATE INDEX "InboundEmail_threadId_idx" ON "InboundEmail"("threadId");

-- CreateIndex
CREATE INDEX "InboundEmail_userId_idx" ON "InboundEmail"("userId");

-- CreateIndex
CREATE INDEX "InboundEmail_dealId_idx" ON "InboundEmail"("dealId");

-- CreateIndex
CREATE INDEX "InboundEmail_talentId_idx" ON "InboundEmail"("talentId");

-- CreateIndex
CREATE INDEX "InboundEmail_brandId_idx" ON "InboundEmail"("brandId");

-- CreateIndex
CREATE INDEX "InboundEmail_platform_idx" ON "InboundEmail"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "InboxMessage_threadId_key" ON "InboxMessage"("threadId");

-- CreateIndex
CREATE INDEX "InboxMessage_lastMessageAt_idx" ON "InboxMessage"("lastMessageAt");

-- CreateIndex
CREATE INDEX "InboxMessage_receivedAt_idx" ON "InboxMessage"("receivedAt");

-- CreateIndex
CREATE INDEX "InboxMessage_userId_idx" ON "InboxMessage"("userId");

-- CreateIndex
CREATE INDEX "InboxMessage_platform_idx" ON "InboxMessage"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "InboxThreadMeta_threadId_key" ON "InboxThreadMeta"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_externalId_key" ON "Invoice"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_xeroId_key" ON "Invoice"("xeroId");

-- CreateIndex
CREATE INDEX "Invoice_brandId_idx" ON "Invoice"("brandId");

-- CreateIndex
CREATE INDEX "Invoice_dealId_idx" ON "Invoice"("dealId");

-- CreateIndex
CREATE INDEX "Invoice_dueAt_idx" ON "Invoice"("dueAt");

-- CreateIndex
CREATE INDEX "Invoice_xeroId_idx" ON "Invoice"("xeroId");

-- CreateIndex
CREATE INDEX "Invoice_externalId_idx" ON "Invoice"("externalId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_email_key" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Opportunity_createdBy_idx" ON "Opportunity"("createdBy");

-- CreateIndex
CREATE INDEX "Opportunity_isActive_createdAt_idx" ON "Opportunity"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "OpportunityApplication_creatorId_status_idx" ON "OpportunityApplication"("creatorId", "status");

-- CreateIndex
CREATE INDEX "OpportunityApplication_opportunityId_status_idx" ON "OpportunityApplication"("opportunityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityApplication_opportunityId_creatorId_key" ON "OpportunityApplication"("opportunityId", "creatorId");

-- CreateIndex
CREATE INDEX "Outreach_archived_idx" ON "Outreach"("archived");

-- CreateIndex
CREATE INDEX "Outreach_createdBy_idx" ON "Outreach"("createdBy");

-- CreateIndex
CREATE INDEX "Outreach_gmailThreadId_idx" ON "Outreach"("gmailThreadId");

-- CreateIndex
CREATE INDEX "Outreach_linkedBrandId_idx" ON "Outreach"("linkedBrandId");

-- CreateIndex
CREATE INDEX "Outreach_linkedCreatorId_idx" ON "Outreach"("linkedCreatorId");

-- CreateIndex
CREATE INDEX "Outreach_linkedCrmBrandId_idx" ON "Outreach"("linkedCrmBrandId");

-- CreateIndex
CREATE INDEX "Outreach_nextFollowUp_idx" ON "Outreach"("nextFollowUp");

-- CreateIndex
CREATE INDEX "Outreach_stage_idx" ON "Outreach"("stage");

-- CreateIndex
CREATE INDEX "OutreachAction_scheduledAt_idx" ON "OutreachAction"("scheduledAt");

-- CreateIndex
CREATE INDEX "OutreachAction_sequenceId_idx" ON "OutreachAction"("sequenceId");

-- CreateIndex
CREATE INDEX "OutreachAction_status_idx" ON "OutreachAction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachEmailThread_gmailThreadId_key" ON "OutreachEmailThread"("gmailThreadId");

-- CreateIndex
CREATE INDEX "OutreachEmailThread_gmailThreadId_idx" ON "OutreachEmailThread"("gmailThreadId");

-- CreateIndex
CREATE INDEX "OutreachEmailThread_outreachId_idx" ON "OutreachEmailThread"("outreachId");

-- CreateIndex
CREATE INDEX "OutreachEmailThread_status_idx" ON "OutreachEmailThread"("status");

-- CreateIndex
CREATE INDEX "OutreachNote_createdAt_idx" ON "OutreachNote"("createdAt");

-- CreateIndex
CREATE INDEX "OutreachNote_outreachId_idx" ON "OutreachNote"("outreachId");

-- CreateIndex
CREATE INDEX "OutreachSequence_leadId_idx" ON "OutreachSequence"("leadId");

-- CreateIndex
CREATE INDEX "OutreachSequence_status_idx" ON "OutreachSequence"("status");

-- CreateIndex
CREATE INDEX "OutreachStep_sequenceId_idx" ON "OutreachStep"("sequenceId");

-- CreateIndex
CREATE INDEX "OutreachTask_dueDate_idx" ON "OutreachTask"("dueDate");

-- CreateIndex
CREATE INDEX "OutreachTask_outreachId_idx" ON "OutreachTask"("outreachId");

-- CreateIndex
CREATE INDEX "OutreachTask_status_idx" ON "OutreachTask"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_stripePaymentIntentId_idx" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Commission_dealId_idx" ON "Commission"("dealId");

-- CreateIndex
CREATE INDEX "Commission_invoiceId_idx" ON "Commission"("invoiceId");

-- CreateIndex
CREATE INDEX "Commission_talentId_idx" ON "Commission"("talentId");

-- CreateIndex
CREATE INDEX "Commission_agentId_idx" ON "Commission"("agentId");

-- CreateIndex
CREATE INDEX "Commission_payoutId_idx" ON "Commission"("payoutId");

-- CreateIndex
CREATE INDEX "Commission_status_idx" ON "Commission"("status");

-- CreateIndex
CREATE INDEX "Commission_calculatedAt_idx" ON "Commission"("calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_referenceId_key" ON "Payout"("referenceId");

-- CreateIndex
CREATE INDEX "Payout_brandId_idx" ON "Payout"("brandId");

-- CreateIndex
CREATE INDEX "Payout_creatorId_idx" ON "Payout"("creatorId");

-- CreateIndex
CREATE INDEX "Payout_dealId_idx" ON "Payout"("dealId");

-- CreateIndex
CREATE INDEX "Payout_expectedPayoutAt_idx" ON "Payout"("expectedPayoutAt");

-- CreateIndex
CREATE INDEX "Payout_referenceId_idx" ON "Payout"("referenceId");

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "Payout"("status");

-- CreateIndex
CREATE INDEX "Payout_userId_idx" ON "Payout"("userId");

-- CreateIndex
CREATE INDEX "Resource_createdById_idx" ON "Resource"("createdById");

-- CreateIndex
CREATE INDEX "Resource_resourceType_idx" ON "Resource"("resourceType");

-- CreateIndex
CREATE INDEX "Resource_status_idx" ON "Resource"("status");

-- CreateIndex
CREATE INDEX "Resource_visibility_idx" ON "Resource"("visibility");

-- CreateIndex
CREATE INDEX "ResourceRsvp_resourceId_idx" ON "ResourceRsvp"("resourceId");

-- CreateIndex
CREATE INDEX "ResourceRsvp_userId_idx" ON "ResourceRsvp"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceRsvp_resourceId_userId_key" ON "ResourceRsvp"("resourceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOpportunity_outreachId_key" ON "SalesOpportunity"("outreachId");

-- CreateIndex
CREATE INDEX "SalesOpportunity_expectedCloseAt_idx" ON "SalesOpportunity"("expectedCloseAt");

-- CreateIndex
CREATE INDEX "SalesOpportunity_outreachId_idx" ON "SalesOpportunity"("outreachId");

-- CreateIndex
CREATE INDEX "SalesOpportunity_status_idx" ON "SalesOpportunity"("status");

-- CreateIndex
CREATE INDEX "SignatureRequest_contractId_idx" ON "SignatureRequest"("contractId");

-- CreateIndex
CREATE INDEX "SignatureRequest_signerEmail_idx" ON "SignatureRequest"("signerEmail");

-- CreateIndex
CREATE INDEX "SignatureRequest_status_idx" ON "SignatureRequest"("status");

-- CreateIndex
CREATE INDEX "SignatureRequest_userId_idx" ON "SignatureRequest"("userId");

-- CreateIndex
CREATE INDEX "SocialAccountConnection_creatorId_connected_idx" ON "SocialAccountConnection"("creatorId", "connected");

-- CreateIndex
CREATE INDEX "SocialAccountConnection_syncStatus_idx" ON "SocialAccountConnection"("syncStatus");

-- CreateIndex
CREATE INDEX "SocialAccountConnection_platform_idx" ON "SocialAccountConnection"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccountConnection_creatorId_platform_key" ON "SocialAccountConnection"("creatorId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "SocialProfile_connectionId_key" ON "SocialProfile"("connectionId");

-- CreateIndex
CREATE INDEX "SocialProfile_platform_handle_idx" ON "SocialProfile"("platform", "handle");

-- CreateIndex
CREATE INDEX "SocialProfile_connectionId_idx" ON "SocialProfile"("connectionId");

-- CreateIndex
CREATE INDEX "SocialPost_profileId_postedAt_idx" ON "SocialPost"("profileId", "postedAt");

-- CreateIndex
CREATE INDEX "SocialPost_platform_postedAt_idx" ON "SocialPost"("platform", "postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPost_platform_externalId_key" ON "SocialPost"("platform", "externalId");

-- CreateIndex
CREATE INDEX "SocialMetric_profileId_snapshotDate_idx" ON "SocialMetric"("profileId", "snapshotDate");

-- CreateIndex
CREATE INDEX "SocialMetric_metricType_snapshotDate_idx" ON "SocialMetric"("metricType", "snapshotDate");

-- CreateIndex
CREATE INDEX "SocialSyncLog_connectionId_createdAt_idx" ON "SocialSyncLog"("connectionId", "createdAt");

-- CreateIndex
CREATE INDEX "SocialSyncLog_platform_status_idx" ON "SocialSyncLog"("platform", "status");

-- CreateIndex
CREATE INDEX "SocialSyncLog_rateLimitHit_idx" ON "SocialSyncLog"("rateLimitHit");

-- CreateIndex
CREATE INDEX "ExternalSocialProfile_platform_lastFetchedAt_idx" ON "ExternalSocialProfile"("platform", "lastFetchedAt");

-- CreateIndex
CREATE INDEX "ExternalSocialProfile_createdAt_idx" ON "ExternalSocialProfile"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalSocialProfile_platform_username_key" ON "ExternalSocialProfile"("platform", "username");

-- CreateIndex
CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt");

-- CreateIndex
CREATE INDEX "Submission_creatorId_status_idx" ON "Submission"("creatorId", "status");

-- CreateIndex
CREATE INDEX "Submission_opportunityId_idx" ON "Submission"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "Talent_userId_key" ON "Talent"("userId");

-- CreateIndex
CREATE INDEX "Talent_lastProfileImageSyncAt_idx" ON "Talent"("lastProfileImageSyncAt");

-- CreateIndex
CREATE INDEX "Talent_profileImageSource_idx" ON "Talent"("profileImageSource");

-- CreateIndex
CREATE INDEX "Talent_currency_idx" ON "Talent"("currency");

-- CreateIndex
CREATE INDEX "TalentEmail_talentId_idx" ON "TalentEmail"("talentId");

-- CreateIndex
CREATE INDEX "TalentEmail_email_idx" ON "TalentEmail"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TalentEmail_talentId_email_key" ON "TalentEmail"("talentId", "email");

-- CreateIndex
CREATE INDEX "TalentManagerAssignment_talentId_idx" ON "TalentManagerAssignment"("talentId");

-- CreateIndex
CREATE INDEX "TalentManagerAssignment_managerId_idx" ON "TalentManagerAssignment"("managerId");

-- CreateIndex
CREATE INDEX "TalentManagerAssignment_role_idx" ON "TalentManagerAssignment"("role");

-- CreateIndex
CREATE UNIQUE INDEX "TalentManagerAssignment_talentId_managerId_key" ON "TalentManagerAssignment"("talentId", "managerId");

-- CreateIndex
CREATE INDEX "TalentTask_talentId_idx" ON "TalentTask"("talentId");

-- CreateIndex
CREATE INDEX "TalentTask_status_idx" ON "TalentTask"("status");

-- CreateIndex
CREATE INDEX "TalentTask_dueDate_idx" ON "TalentTask"("dueDate");

-- CreateIndex
CREATE INDEX "TalentSocial_talentId_idx" ON "TalentSocial"("talentId");

-- CreateIndex
CREATE INDEX "TalentSocial_platform_idx" ON "TalentSocial"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "TalentSocial_talentId_platform_handle_key" ON "TalentSocial"("talentId", "platform", "handle");

-- CreateIndex
CREATE UNIQUE INDEX "TalentAssignment_agentId_talentId_key" ON "TalentAssignment"("agentId", "talentId");

-- CreateIndex
CREATE INDEX "TalentUserAccess_talentId_idx" ON "TalentUserAccess"("talentId");

-- CreateIndex
CREATE INDEX "TalentUserAccess_userId_idx" ON "TalentUserAccess"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TalentUserAccess_talentId_userId_key" ON "TalentUserAccess"("talentId", "userId");

-- CreateIndex
CREATE INDEX "TrackingPixelEvent_emailId_idx" ON "TrackingPixelEvent"("emailId");

-- CreateIndex
CREATE INDEX "TrackingPixelEvent_openedAt_idx" ON "TrackingPixelEvent"("openedAt");

-- CreateIndex
CREATE INDEX "EmailClickEvent_emailId_idx" ON "EmailClickEvent"("emailId");

-- CreateIndex
CREATE INDEX "EmailClickEvent_clickedAt_idx" ON "EmailClickEvent"("clickedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "WellnessCheckin_creatorId_createdAt_idx" ON "WellnessCheckin"("creatorId", "createdAt");

-- CreateIndex
CREATE INDEX "XeroConnection_userId_idx" ON "XeroConnection"("userId");

-- CreateIndex
CREATE INDEX "IntegrationConnection_userId_connected_idx" ON "IntegrationConnection"("userId", "connected");

-- CreateIndex
CREATE INDEX "IntegrationConnection_platform_idx" ON "IntegrationConnection"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnection_userId_platform_key" ON "IntegrationConnection"("userId", "platform");

-- CreateIndex
CREATE INDEX "BrandSavedTalent_brandId_status_idx" ON "BrandSavedTalent"("brandId", "status");

-- CreateIndex
CREATE INDEX "BrandSavedTalent_talentId_idx" ON "BrandSavedTalent"("talentId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandSavedTalent_brandId_talentId_key" ON "BrandSavedTalent"("brandId", "talentId");

-- CreateIndex
CREATE INDEX "BrandBrief_brandId_idx" ON "BrandBrief"("brandId");

-- CreateIndex
CREATE INDEX "BrandBrief_status_idx" ON "BrandBrief"("status");

-- CreateIndex
CREATE INDEX "BrandBrief_createdBy_idx" ON "BrandBrief"("createdBy");

-- CreateIndex
CREATE INDEX "BriefMatch_briefId_idx" ON "BriefMatch"("briefId");

-- CreateIndex
CREATE INDEX "BriefMatch_creatorId_idx" ON "BriefMatch"("creatorId");

-- CreateIndex
CREATE INDEX "BriefMatch_status_idx" ON "BriefMatch"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BriefMatch_briefId_creatorId_key" ON "BriefMatch"("briefId", "creatorId");

-- CreateIndex
CREATE INDEX "OutreachLead_status_idx" ON "OutreachLead"("status");

-- CreateIndex
CREATE INDEX "OutreachLead_createdBy_idx" ON "OutreachLead"("createdBy");

-- CreateIndex
CREATE INDEX "OutreachLead_convertedToOutreachId_idx" ON "OutreachLead"("convertedToOutreachId");

-- CreateIndex
CREATE INDEX "CreatorWeeklyReport_creatorId_idx" ON "CreatorWeeklyReport"("creatorId");

-- CreateIndex
CREATE INDEX "CreatorWeeklyReport_weekStartDate_idx" ON "CreatorWeeklyReport"("weekStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorWeeklyReport_creatorId_weekStartDate_key" ON "CreatorWeeklyReport"("creatorId", "weekStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "DealIntelligence_dealId_key" ON "DealIntelligence"("dealId");

-- CreateIndex
CREATE INDEX "DealIntelligence_dealId_idx" ON "DealIntelligence"("dealId");

-- CreateIndex
CREATE INDEX "Bundle_dealId_idx" ON "Bundle"("dealId");

-- CreateIndex
CREATE INDEX "Bundle_creatorId_idx" ON "Bundle"("creatorId");

-- CreateIndex
CREATE INDEX "Bundle_status_idx" ON "Bundle"("status");

-- CreateIndex
CREATE INDEX "CreatorFitScore_brandId_totalScore_idx" ON "CreatorFitScore"("brandId", "totalScore");

-- CreateIndex
CREATE INDEX "CreatorFitScore_talentId_idx" ON "CreatorFitScore"("talentId");

-- CreateIndex
CREATE INDEX "CreatorFitScore_campaignId_idx" ON "CreatorFitScore"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE INDEX "Page_slug_idx" ON "Page"("slug");

-- CreateIndex
CREATE INDEX "Page_roleScope_idx" ON "Page"("roleScope");

-- CreateIndex
CREATE INDEX "Page_isActive_idx" ON "Page"("isActive");

-- CreateIndex
CREATE INDEX "PageBlock_pageId_idx" ON "PageBlock"("pageId");

-- CreateIndex
CREATE INDEX "PageBlock_pageId_order_idx" ON "PageBlock"("pageId", "order");

-- CreateIndex
CREATE INDEX "PageBlock_blockType_idx" ON "PageBlock"("blockType");

-- CreateIndex
CREATE INDEX "PageBlockDraft_pageId_idx" ON "PageBlockDraft"("pageId");

-- CreateIndex
CREATE INDEX "PageBlockDraft_pageId_order_idx" ON "PageBlockDraft"("pageId", "order");

-- CreateIndex
CREATE INDEX "UGCRequest_userId_idx" ON "UGCRequest"("userId");

-- CreateIndex
CREATE INDEX "UGCRequest_status_idx" ON "UGCRequest"("status");

-- CreateIndex
CREATE INDEX "DealDraft_userId_idx" ON "DealDraft"("userId");

-- CreateIndex
CREATE INDEX "DealDraft_dealId_idx" ON "DealDraft"("dealId");

-- CreateIndex
CREATE INDEX "DealDraft_status_idx" ON "DealDraft"("status");

-- CreateIndex
CREATE INDEX "OutreachPlan_userId_idx" ON "OutreachPlan"("userId");

-- CreateIndex
CREATE INDEX "OutreachPlan_status_idx" ON "OutreachPlan"("status");

-- CreateIndex
CREATE INDEX "BrandIntelligence_brandId_idx" ON "BrandIntelligence"("brandId");

-- CreateIndex
CREATE INDEX "BrandIntelligence_category_idx" ON "BrandIntelligence"("category");

-- CreateIndex
CREATE INDEX "NegotiationInsight_dealId_idx" ON "NegotiationInsight"("dealId");

-- CreateIndex
CREATE INDEX "UGCListing_userId_idx" ON "UGCListing"("userId");

-- CreateIndex
CREATE INDEX "UGCListing_status_idx" ON "UGCListing"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Reconciliation_invoiceId_key" ON "Reconciliation"("invoiceId");

-- CreateIndex
CREATE INDEX "Reconciliation_referenceId_idx" ON "Reconciliation"("referenceId");

-- CreateIndex
CREATE INDEX "Reconciliation_type_idx" ON "Reconciliation"("type");

-- CreateIndex
CREATE INDEX "RevenueSource_talentId_idx" ON "RevenueSource"("talentId");

-- CreateIndex
CREATE INDEX "RevenueSource_platform_idx" ON "RevenueSource"("platform");

-- CreateIndex
CREATE INDEX "RevenueSource_status_idx" ON "RevenueSource"("status");

-- CreateIndex
CREATE INDEX "RevenueSource_talentId_platform_idx" ON "RevenueSource"("talentId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueSource_talentId_platform_externalAccountId_key" ON "RevenueSource"("talentId", "platform", "externalAccountId");

-- CreateIndex
CREATE INDEX "RevenueEvent_revenueSourceId_idx" ON "RevenueEvent"("revenueSourceId");

-- CreateIndex
CREATE INDEX "RevenueEvent_date_idx" ON "RevenueEvent"("date");

-- CreateIndex
CREATE INDEX "RevenueEvent_type_idx" ON "RevenueEvent"("type");

-- CreateIndex
CREATE INDEX "RevenueEvent_revenueSourceId_date_idx" ON "RevenueEvent"("revenueSourceId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueEvent_revenueSourceId_sourceReference_key" ON "RevenueEvent"("revenueSourceId", "sourceReference");

-- CreateIndex
CREATE INDEX "RevenueGoal_talentId_idx" ON "RevenueGoal"("talentId");

-- CreateIndex
CREATE INDEX "RevenueGoal_goalType_idx" ON "RevenueGoal"("goalType");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueGoal_talentId_goalType_platform_key" ON "RevenueGoal"("talentId", "goalType", "platform");

-- CreateIndex
CREATE INDEX "UserDashboardConfig_userId_idx" ON "UserDashboardConfig"("userId");

-- CreateIndex
CREATE INDEX "UserDashboardConfig_dashboardType_idx" ON "UserDashboardConfig"("dashboardType");

-- CreateIndex
CREATE UNIQUE INDEX "UserDashboardConfig_userId_dashboardType_key" ON "UserDashboardConfig"("userId", "dashboardType");

-- CreateIndex
CREATE INDEX "BrandUser_brandId_idx" ON "BrandUser"("brandId");

-- CreateIndex
CREATE INDEX "BrandUser_userId_idx" ON "BrandUser"("userId");

-- CreateIndex
CREATE INDEX "BrandUser_status_idx" ON "BrandUser"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BrandUser_brandId_userId_key" ON "BrandUser"("brandId", "userId");

-- CreateIndex
CREATE INDEX "AuditSource_brandId_idx" ON "AuditSource"("brandId");

-- CreateIndex
CREATE INDEX "AuditSource_type_idx" ON "AuditSource"("type");

-- CreateIndex
CREATE INDEX "AuditSource_status_idx" ON "AuditSource"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AuditSource_brandId_type_source_key" ON "AuditSource"("brandId", "type", "source");

-- CreateIndex
CREATE INDEX "CommunityConnection_talentId_idx" ON "CommunityConnection"("talentId");

-- CreateIndex
CREATE INDEX "CommunityConnection_platform_idx" ON "CommunityConnection"("platform");

-- CreateIndex
CREATE INDEX "CommunityConnection_status_idx" ON "CommunityConnection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityConnection_talentId_platform_key" ON "CommunityConnection"("talentId", "platform");

-- CreateIndex
CREATE INDEX "CommunityMetric_talentId_idx" ON "CommunityMetric"("talentId");

-- CreateIndex
CREATE INDEX "CommunityMetric_connectionId_idx" ON "CommunityMetric"("connectionId");

-- CreateIndex
CREATE INDEX "CommunityMetric_metricType_idx" ON "CommunityMetric"("metricType");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityMetric_connectionId_metricType_period_key" ON "CommunityMetric"("connectionId", "metricType", "period");

-- CreateIndex
CREATE INDEX "ExportSchedule_userId_idx" ON "ExportSchedule"("userId");

-- CreateIndex
CREATE INDEX "ExportSchedule_enabled_idx" ON "ExportSchedule"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "ExportSchedule_talentId_userId_key" ON "ExportSchedule"("talentId", "userId");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIPromptHistory" ADD CONSTRAINT "AIPromptHistory_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentProfile" ADD CONSTRAINT "AgentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentPolicy" ADD CONSTRAINT "AgentPolicy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_requestorId_fkey" FOREIGN KEY ("requestorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTokenLog" ADD CONSTRAINT "AiTokenLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandCampaign" ADD CONSTRAINT "BrandCampaign_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignBrandPivot" ADD CONSTRAINT "CampaignBrandPivot_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "BrandCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalQueueTask" ADD CONSTRAINT "InternalQueueTask_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalQueueTask" ADD CONSTRAINT "InternalQueueTask_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorEvent" ADD CONSTRAINT "CreatorEvent_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorEvent" ADD CONSTRAINT "CreatorEvent_sourceUserId_fkey" FOREIGN KEY ("sourceUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorGoal" ADD CONSTRAINT "CreatorGoal_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorGoalVersion" ADD CONSTRAINT "CreatorGoalVersion_creatorGoalId_fkey" FOREIGN KEY ("creatorGoalId") REFERENCES "CreatorGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorInsight" ADD CONSTRAINT "CreatorInsight_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorTask" ADD CONSTRAINT "CreatorTask_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorTask" ADD CONSTRAINT "CreatorTask_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorTask" ADD CONSTRAINT "CreatorTask_linkedDealId_fkey" FOREIGN KEY ("linkedDealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorTask" ADD CONSTRAINT "CreatorTask_linkedDeliverableId_fkey" FOREIGN KEY ("linkedDeliverableId") REFERENCES "Deliverable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmBrandContact" ADD CONSTRAINT "CrmBrandContact_crmBrandId_fkey" FOREIGN KEY ("crmBrandId") REFERENCES "CrmBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmCampaign" ADD CONSTRAINT "CrmCampaign_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "CrmBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "CrmCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "SalesOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealNegotiation" ADD CONSTRAINT "DealNegotiation_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealTimeline" ADD CONSTRAINT "DealTimeline_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealTimeline" ADD CONSTRAINT "DealTimeline_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailFeedback" ADD CONSTRAINT "EmailFeedback_emailOpportunityId_fkey" FOREIGN KEY ("emailOpportunityId") REFERENCES "EmailOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailFeedback" ADD CONSTRAINT "EmailFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailOpportunity" ADD CONSTRAINT "EmailOpportunity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceActivityLog" ADD CONSTRAINT "FinanceActivityLog_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceDocument" ADD CONSTRAINT "FinanceDocument_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceReconciliation" ADD CONSTRAINT "FinanceReconciliation_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GmailToken" ADD CONSTRAINT "GmailToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleAccount" ADD CONSTRAINT "GoogleAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundEmail" ADD CONSTRAINT "InboundEmail_inboxMessageId_fkey" FOREIGN KEY ("inboxMessageId") REFERENCES "InboxMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundEmail" ADD CONSTRAINT "InboundEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundEmail" ADD CONSTRAINT "InboundEmail_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundEmail" ADD CONSTRAINT "InboundEmail_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxThreadMeta" ADD CONSTRAINT "InboxThreadMeta_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "InboxMessage"("threadId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityApplication" ADD CONSTRAINT "OpportunityApplication_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityApplication" ADD CONSTRAINT "OpportunityApplication_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outreach" ADD CONSTRAINT "Outreach_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outreach" ADD CONSTRAINT "Outreach_linkedBrandId_fkey" FOREIGN KEY ("linkedBrandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outreach" ADD CONSTRAINT "Outreach_linkedCreatorId_fkey" FOREIGN KEY ("linkedCreatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outreach" ADD CONSTRAINT "Outreach_linkedCrmBrandId_fkey" FOREIGN KEY ("linkedCrmBrandId") REFERENCES "CrmBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachEmailThread" ADD CONSTRAINT "OutreachEmailThread_outreachId_fkey" FOREIGN KEY ("outreachId") REFERENCES "Outreach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachNote" ADD CONSTRAINT "OutreachNote_outreachId_fkey" FOREIGN KEY ("outreachId") REFERENCES "Outreach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachTask" ADD CONSTRAINT "OutreachTask_outreachId_fkey" FOREIGN KEY ("outreachId") REFERENCES "Outreach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceRsvp" ADD CONSTRAINT "ResourceRsvp_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceRsvp" ADD CONSTRAINT "ResourceRsvp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskEvent" ADD CONSTRAINT "RiskEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOpportunity" ADD CONSTRAINT "SalesOpportunity_outreachId_fkey" FOREIGN KEY ("outreachId") REFERENCES "Outreach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAccountConnection" ADD CONSTRAINT "SocialAccountConnection_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialProfile" ADD CONSTRAINT "SocialProfile_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "SocialAccountConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "SocialProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMetric" ADD CONSTRAINT "SocialMetric_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "SocialProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialSyncLog" ADD CONSTRAINT "SocialSyncLog_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "SocialAccountConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuitabilityResult" ADD CONSTRAINT "SuitabilityResult_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuitabilityResult" ADD CONSTRAINT "SuitabilityResult_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Talent" ADD CONSTRAINT "Talent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentEmail" ADD CONSTRAINT "TalentEmail_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentManagerAssignment" ADD CONSTRAINT "TalentManagerAssignment_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentManagerAssignment" ADD CONSTRAINT "TalentManagerAssignment_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentTask" ADD CONSTRAINT "TalentTask_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentSocial" ADD CONSTRAINT "TalentSocial_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentAssignment" ADD CONSTRAINT "TalentAssignment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentAssignment" ADD CONSTRAINT "TalentAssignment_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentUserAccess" ADD CONSTRAINT "TalentUserAccess_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentUserAccess" ADD CONSTRAINT "TalentUserAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingPixelEvent" ADD CONSTRAINT "TrackingPixelEvent_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "InboundEmail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailClickEvent" ADD CONSTRAINT "EmailClickEvent_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "InboundEmail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WellnessCheckin" ADD CONSTRAINT "WellnessCheckin_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XeroConnection" ADD CONSTRAINT "XeroConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandSavedTalent" ADD CONSTRAINT "BrandSavedTalent_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandSavedTalent" ADD CONSTRAINT "BrandSavedTalent_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefMatch" ADD CONSTRAINT "BriefMatch_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "BrandBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorFitScore" ADD CONSTRAINT "CreatorFitScore_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorFitScore" ADD CONSTRAINT "CreatorFitScore_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageBlock" ADD CONSTRAINT "PageBlock_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageBlock" ADD CONSTRAINT "PageBlock_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageBlockDraft" ADD CONSTRAINT "PageBlockDraft_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageBlockDraft" ADD CONSTRAINT "PageBlockDraft_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UGCRequest" ADD CONSTRAINT "UGCRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealDraft" ADD CONSTRAINT "DealDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachPlan" ADD CONSTRAINT "OutreachPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UGCListing" ADD CONSTRAINT "UGCListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueSource" ADD CONSTRAINT "RevenueSource_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueEvent" ADD CONSTRAINT "RevenueEvent_revenueSourceId_fkey" FOREIGN KEY ("revenueSourceId") REFERENCES "RevenueSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueGoal" ADD CONSTRAINT "RevenueGoal_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDashboardConfig" ADD CONSTRAINT "UserDashboardConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandUser" ADD CONSTRAINT "BrandUser_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandUser" ADD CONSTRAINT "BrandUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditSource" ADD CONSTRAINT "AuditSource_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityConnection" ADD CONSTRAINT "CommunityConnection_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMetric" ADD CONSTRAINT "CommunityMetric_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "CommunityConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportSchedule" ADD CONSTRAINT "ExportSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

