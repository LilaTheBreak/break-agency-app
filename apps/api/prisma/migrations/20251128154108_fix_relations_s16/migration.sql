-- AlterTable
ALTER TABLE "AIAgentExecutionLog" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "AIAgentTask" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "AIAgentTask" ADD CONSTRAINT "AIAgentTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAgentExecutionLog" ADD CONSTRAINT "AIAgentExecutionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
