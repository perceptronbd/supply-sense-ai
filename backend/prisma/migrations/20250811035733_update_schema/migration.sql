/*
  Warnings:

  - The values [FREE] on the enum `SubscriptionPlans` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `currentPeriodEnd` on the `company_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `currentPeriodStart` on the `company_subscriptions` table. All the data in the column will be lost.
  - Added the required column `companySubscriptionHistoryId` to the `purchase_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `credits` to the `subscription_plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionPlans_new" AS ENUM ('STARTER', 'BUSINESS', 'ENTERPRISE');
ALTER TABLE "subscription_plans" ALTER COLUMN "name" DROP DEFAULT;
ALTER TABLE "subscription_plans" ALTER COLUMN "name" TYPE "SubscriptionPlans_new" USING ("name"::text::"SubscriptionPlans_new");
ALTER TYPE "SubscriptionPlans" RENAME TO "SubscriptionPlans_old";
ALTER TYPE "SubscriptionPlans_new" RENAME TO "SubscriptionPlans";
DROP TYPE "SubscriptionPlans_old";
ALTER TABLE "subscription_plans" ALTER COLUMN "name" SET DEFAULT 'STARTER';
COMMIT;

-- AlterTable
ALTER TABLE "company_subscriptions" DROP COLUMN "currentPeriodEnd",
DROP COLUMN "currentPeriodStart",
ADD COLUMN     "endPeriod" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "remainingCredits" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "startPeriod" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "totalCredits" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "purchase_history" ADD COLUMN     "companySubscriptionHistoryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "advancedFiltering" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "apiAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bulkImportExport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "credits" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "customIntegrations" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dedicatedManager" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "earlyBetaAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prioritySupport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "privateModelTuning" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quarterlyReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "roleBasedAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slaUptimeGuarantee" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "name" SET DEFAULT 'STARTER';

-- CreateTable
CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "toolUsed" TEXT DEFAULT '',
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "costUSD" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "creditsCharged" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,

    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_subscription_history" (
    "id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "startPeriod" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endPeriod" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "stripeSubscriptionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "subscriptionPlanId" TEXT NOT NULL,

    CONSTRAINT "company_subscription_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_subscription_history_stripeSubscriptionId_key" ON "company_subscription_history"("stripeSubscriptionId");

-- AddForeignKey
ALTER TABLE "UsageRecord" ADD CONSTRAINT "UsageRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_subscription_history" ADD CONSTRAINT "company_subscription_history_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_subscription_history" ADD CONSTRAINT "company_subscription_history_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_history" ADD CONSTRAINT "purchase_history_companySubscriptionHistoryId_fkey" FOREIGN KEY ("companySubscriptionHistoryId") REFERENCES "company_subscription_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;
