-- CreateTable enriched_contact
CREATE TABLE IF NOT EXISTS "enriched_contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "jobTitle" TEXT,
    "company" TEXT,
    "linkedInUrl" TEXT,
    "linkedInId" TEXT,
    "confidenceScore" INTEGER NOT NULL DEFAULT 50,
    "source" TEXT NOT NULL,
    "discoveryMethod" TEXT,
    "linkedBrandId" TEXT,
    "linkedContactId" TEXT,
    "discoveredAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP,
    "addedToCrmAt" TIMESTAMP,
    "complianceCheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "lawfulBasis" TEXT,
    "notes" TEXT,
    "activity" JSON NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "enriched_contact_linkedBrandId_fkey" FOREIGN KEY ("linkedBrandId") REFERENCES "CrmBrand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "enriched_contact_linkedContactId_fkey" FOREIGN KEY ("linkedContactId") REFERENCES "CrmBrandContact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable contact_email
CREATE TABLE IF NOT EXISTS "contact_email" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'unknown',
    "verificationMethod" TEXT,
    "verificationScore" INTEGER NOT NULL DEFAULT 50,
    "generationMethod" TEXT NOT NULL,
    "namePermutations" JSON NOT NULL DEFAULT '[]',
    "mxCheckPassed" BOOLEAN,
    "smtpCheckPassed" BOOLEAN,
    "apiSource" TEXT,
    "enrichedContactId" TEXT NOT NULL,
    "notes" TEXT,
    "lastCheckedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "contact_email_enrichedContactId_fkey" FOREIGN KEY ("enrichedContactId") REFERENCES "enriched_contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable enrichment_job
CREATE TABLE IF NOT EXISTS "enrichment_job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "brandId" TEXT,
    "brandName" TEXT,
    "brandWebsite" TEXT,
    "linkedInCompanyUrl" TEXT,
    "contactsDiscovered" INTEGER NOT NULL DEFAULT 0,
    "contactsEnriched" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "regionCode" TEXT,
    "complianceMode" BOOLEAN NOT NULL DEFAULT true,
    "rateLimitBucket" TEXT,
    "startedAt" TIMESTAMP,
    "completedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "enrichment_job_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "CrmBrand" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable enrichment_audit_log
CREATE TABLE IF NOT EXISTS "enrichment_audit_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandId" TEXT,
    "brandName" TEXT,
    "contactsAffected" INTEGER NOT NULL DEFAULT 0,
    "complianceChecks" JSON NOT NULL DEFAULT '{}',
    "lawfulBasis" TEXT,
    "regionCode" TEXT,
    "details" JSON NOT NULL DEFAULT '{}',
    "metadata" JSON NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "enrichment_audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "enriched_contact_linkedBrandId_idx" ON "enriched_contact"("linkedBrandId");
CREATE INDEX IF NOT EXISTS "enriched_contact_linkedInId_idx" ON "enriched_contact"("linkedInId");
CREATE INDEX IF NOT EXISTS "enriched_contact_company_idx" ON "enriched_contact"("company");
CREATE INDEX IF NOT EXISTS "enriched_contact_confidenceScore_idx" ON "enriched_contact"("confidenceScore");
CREATE INDEX IF NOT EXISTS "enriched_contact_discoveredAt_idx" ON "enriched_contact"("discoveredAt");
CREATE INDEX IF NOT EXISTS "enriched_contact_complianceCheckPassed_idx" ON "enriched_contact"("complianceCheckPassed");

CREATE UNIQUE INDEX IF NOT EXISTS "contact_email_enrichedContactId_email_key" ON "contact_email"("enrichedContactId", "email");
CREATE INDEX IF NOT EXISTS "contact_email_enrichedContactId_idx" ON "contact_email"("enrichedContactId");
CREATE INDEX IF NOT EXISTS "contact_email_verificationStatus_idx" ON "contact_email"("verificationStatus");
CREATE INDEX IF NOT EXISTS "contact_email_email_idx" ON "contact_email"("email");

CREATE INDEX IF NOT EXISTS "enrichment_job_brandId_idx" ON "enrichment_job"("brandId");
CREATE INDEX IF NOT EXISTS "enrichment_job_status_idx" ON "enrichment_job"("status");

CREATE INDEX IF NOT EXISTS "enrichment_audit_log_userId_idx" ON "enrichment_audit_log"("userId");
CREATE INDEX IF NOT EXISTS "enrichment_audit_log_action_idx" ON "enrichment_audit_log"("action");
CREATE INDEX IF NOT EXISTS "enrichment_audit_log_entityId_idx" ON "enrichment_audit_log"("entityId");
CREATE INDEX IF NOT EXISTS "enrichment_audit_log_createdAt_idx" ON "enrichment_audit_log"("createdAt");
