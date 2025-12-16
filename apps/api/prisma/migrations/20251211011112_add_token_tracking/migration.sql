/*
  Warnings:

  - You are about to drop the `AITokenLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AITokenLog" DROP CONSTRAINT "AITokenLog_userId_fkey";

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "campaignLiveAt" TIMESTAMP(3),
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "contractReceivedAt" TIMESTAMP(3),
ADD COLUMN     "contractSignedAt" TIMESTAMP(3),
ADD COLUMN     "deliverablesCompletedAt" TIMESTAMP(3),
ADD COLUMN     "negotiationStartedAt" TIMESTAMP(3),
ADD COLUMN     "proposalSentAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "AITokenLog";

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

-- AddForeignKey
ALTER TABLE "AiTokenLog" ADD CONSTRAINT "AiTokenLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
