-- CreateTable RevenueSource
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

-- CreateTable RevenueEvent
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

-- CreateTable RevenueGoal
CREATE TABLE "RevenueGoal" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "goalType" TEXT NOT NULL,
    "platform" TEXT,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RevenueSource_talentId_platform_externalAccountId_key" ON "RevenueSource"("talentId", "platform", "externalAccountId");

-- CreateIndex
CREATE INDEX "RevenueSource_talentId_idx" ON "RevenueSource"("talentId");

-- CreateIndex
CREATE INDEX "RevenueSource_platform_idx" ON "RevenueSource"("platform");

-- CreateIndex
CREATE INDEX "RevenueSource_status_idx" ON "RevenueSource"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueEvent_revenueSourceId_sourceReference_key" ON "RevenueEvent"("revenueSourceId", "sourceReference");

-- CreateIndex
CREATE INDEX "RevenueEvent_revenueSourceId_idx" ON "RevenueEvent"("revenueSourceId");

-- CreateIndex
CREATE INDEX "RevenueEvent_date_idx" ON "RevenueEvent"("date");

-- CreateIndex
CREATE INDEX "RevenueEvent_type_idx" ON "RevenueEvent"("type");

-- CreateIndex
CREATE INDEX "RevenueEvent_revenueSourceId_date_idx" ON "RevenueEvent"("revenueSourceId", "date");

-- CreateIndex
CREATE INDEX "RevenueGoal_talentId_idx" ON "RevenueGoal"("talentId");

-- AddForeignKey
ALTER TABLE "RevenueSource" ADD CONSTRAINT "RevenueSource_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueEvent" ADD CONSTRAINT "RevenueEvent_revenueSourceId_fkey" FOREIGN KEY ("revenueSourceId") REFERENCES "RevenueSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueGoal" ADD CONSTRAINT "RevenueGoal_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
