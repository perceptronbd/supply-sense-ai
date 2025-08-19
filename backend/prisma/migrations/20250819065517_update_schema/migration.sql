/*
  Warnings:

  - Made the column `timestamp` on table `usage_record` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "SubscriptionPlans" ADD VALUE 'TRIAL';

-- DropIndex
DROP INDEX "company_subscription_history_companyId_idx";

-- DropIndex
DROP INDEX "company_subscriptions_companyId_idx";

-- DropIndex
DROP INDEX "purchase_history_companyId_idx";

-- DropIndex
DROP INDEX "idx_schema_cache_db_connection";

-- DropIndex
DROP INDEX "usage_record_companyId_idx";

-- AlterTable
ALTER TABLE "usage_record" ALTER COLUMN "timestamp" SET NOT NULL;
