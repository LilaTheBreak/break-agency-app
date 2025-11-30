-- CreateTable
CREATE TABLE "InboundMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "externalId" TEXT,
    "senderHandle" TEXT,
    "senderName" TEXT,
    "senderImage" TEXT,
    "message" TEXT NOT NULL,
    "rawData" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aiCategory" TEXT,
    "aiBrand" TEXT,
    "aiUrgency" TEXT,
    "aiRecommendedAction" TEXT,
    "aiConfidence" DOUBLE PRECISION,
    "aiJson" JSONB,
    "linkedEmailId" TEXT,
    "linkedDealId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboundMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InboundMessage_userId_idx" ON "InboundMessage"("userId");

-- CreateIndex
CREATE INDEX "InboundMessage_platform_idx" ON "InboundMessage"("platform");

-- CreateIndex
CREATE INDEX "InboundMessage_receivedAt_idx" ON "InboundMessage"("receivedAt");

-- CreateIndex
CREATE INDEX "InboundMessage_aiCategory_idx" ON "InboundMessage"("aiCategory");

-- AddForeignKey
ALTER TABLE "InboundMessage" ADD CONSTRAINT "InboundMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
