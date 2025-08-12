/*
  Warnings:

  - You are about to drop the `UsageRecord` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UsageRecord" DROP CONSTRAINT "UsageRecord_companyId_fkey";

-- DropTable
DROP TABLE "UsageRecord";

-- CreateTable
CREATE TABLE "usage_record" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "toolUsed" TEXT DEFAULT '',
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "costUSD" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "creditsCharged" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,

    CONSTRAINT "usage_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_record_companyId_idx" ON "usage_record"("companyId");

-- CreateIndex
CREATE INDEX "company_subscription_history_companyId_idx" ON "company_subscription_history"("companyId");

-- CreateIndex
CREATE INDEX "company_subscriptions_companyId_idx" ON "company_subscriptions"("companyId");

-- CreateIndex
CREATE INDEX "purchase_history_companyId_idx" ON "purchase_history"("companyId");

-- AddForeignKey
ALTER TABLE "usage_record" ADD CONSTRAINT "usage_record_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
