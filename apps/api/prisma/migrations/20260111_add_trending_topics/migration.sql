-- CreateTable TrendingTopicSnapshot
CREATE TABLE "TrendingTopicSnapshot" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "velocity" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION,
    "category" TEXT,
    "relatedKeywords" TEXT[],
    "relevanceScore" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT,
    "snapshotJson" JSONB NOT NULL,
    "cachedUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrendingTopicSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrendingTopicSnapshot_talentId_createdAt_idx" ON "TrendingTopicSnapshot"("talentId", "createdAt");

-- CreateIndex
CREATE INDEX "TrendingTopicSnapshot_talentId_source_idx" ON "TrendingTopicSnapshot"("talentId", "source");

-- CreateIndex
CREATE INDEX "TrendingTopicSnapshot_createdAt_idx" ON "TrendingTopicSnapshot"("createdAt");
