-- CreateTable "Inbox"
CREATE TABLE IF NOT EXISTS "Inbox" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL DEFAULT 'admin',
    "ownerId" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "syncStatus" TEXT NOT NULL DEFAULT 'idle',
    "lastSyncedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Inbox_userId_provider_emailAddress_key" ON "Inbox"("userId", "provider", "emailAddress");

-- CreateIndex
CREATE INDEX "Inbox_userId_idx" ON "Inbox"("userId");

-- CreateIndex
CREATE INDEX "Inbox_isDefault_idx" ON "Inbox"("isDefault");

-- CreateIndex
CREATE INDEX "Inbox_provider_idx" ON "Inbox"("provider");

-- AddForeignKey
ALTER TABLE "Inbox" ADD CONSTRAINT "Inbox_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddColumn to InboxMessage if it doesn't exist
ALTER TABLE "InboxMessage" ADD COLUMN IF NOT EXISTS "inboxId" TEXT;

-- CreateIndex for inboxId
CREATE INDEX IF NOT EXISTS "InboxMessage_inboxId_idx" ON "InboxMessage"("inboxId");
