/*
  Warnings:

  - Changed the type of `module` on the `permissions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionPlans" AS ENUM ('FREE', 'BUSINESS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('API_REQUEST', 'CHAT');

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "businessContext" TEXT DEFAULT '',
ADD COLUMN     "industry" TEXT;

-- AlterTable
ALTER TABLE "permissions" DROP COLUMN "module",
ADD COLUMN     "module" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "schema_cache" (
    "id" TEXT NOT NULL,
    "schema" JSONB NOT NULL,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "schema_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "db_connections" (
    "id" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "database" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "encryptedPassword" TEXT NOT NULL,
    "sslEnabled" BOOLEAN NOT NULL DEFAULT false,
    "connectionHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "db_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_relations" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "columnName" TEXT NOT NULL,
    "refTable" TEXT NOT NULL,
    "refColumn" TEXT NOT NULL,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "dbConnectionId" TEXT NOT NULL,

    CONSTRAINT "table_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_metadata" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "friendlyLabel" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "updateFrequency" TEXT NOT NULL,
    "dataSensitivity" TEXT[],
    "sampleQuestions" TEXT[],
    "dbConnectionId" TEXT NOT NULL,

    CONSTRAINT "table_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" "SubscriptionPlans" NOT NULL DEFAULT 'FREE',
    "priceMonthly" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "priceYearly" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "features" JSONB NOT NULL,
    "apiRequestsLimit" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_subscriptions" (
    "id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "stripeSubscriptionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "subscriptionPlanId" TEXT NOT NULL,

    CONSTRAINT "company_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_history" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentStatus" "PaymentStatus" NOT NULL,
    "stripePaymentIntentId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "purchase_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_tracking" (
    "id" TEXT NOT NULL,
    "resourceType" "ResourceType" NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "usage_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schema_cache_companyId_key" ON "schema_cache"("companyId");

-- CreateIndex
CREATE INDEX "idx_schema_cache_company_id" ON "schema_cache"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "db_connections_connectionHash_key" ON "db_connections"("connectionHash");

-- CreateIndex
CREATE UNIQUE INDEX "db_connections_companyId_key" ON "db_connections"("companyId");

-- CreateIndex
CREATE INDEX "idx_db_connections_username" ON "db_connections"("username");

-- CreateIndex
CREATE UNIQUE INDEX "db_connections_companyId_username_key" ON "db_connections"("companyId", "username");

-- CreateIndex
CREATE INDEX "idx_table_relations_table_column" ON "table_relations"("tableName", "columnName");

-- CreateIndex
CREATE UNIQUE INDEX "table_relations_dbConnectionId_tableName_columnName_key" ON "table_relations"("dbConnectionId", "tableName", "columnName");

-- CreateIndex
CREATE UNIQUE INDEX "table_metadata_dbConnectionId_key" ON "table_metadata"("dbConnectionId");

-- CreateIndex
CREATE UNIQUE INDEX "table_metadata_dbConnectionId_tableName_key" ON "table_metadata"("dbConnectionId", "tableName");

-- CreateIndex
CREATE INDEX "idx_subscription_plan_name" ON "subscription_plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "company_subscriptions_stripeSubscriptionId_key" ON "company_subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "company_subscriptions_companyId_key" ON "company_subscriptions"("companyId");

-- CreateIndex
CREATE INDEX "idx_purchase_history_payment_status" ON "purchase_history"("paymentStatus");

-- CreateIndex
CREATE INDEX "idx_company_name" ON "companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_module_action_key" ON "permissions"("module", "action");

-- AddForeignKey
ALTER TABLE "schema_cache" ADD CONSTRAINT "schema_cache_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "db_connections" ADD CONSTRAINT "db_connections_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_relations" ADD CONSTRAINT "table_relations_dbConnectionId_fkey" FOREIGN KEY ("dbConnectionId") REFERENCES "db_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_metadata" ADD CONSTRAINT "table_metadata_dbConnectionId_fkey" FOREIGN KEY ("dbConnectionId") REFERENCES "db_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_subscriptions" ADD CONSTRAINT "company_subscriptions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_subscriptions" ADD CONSTRAINT "company_subscriptions_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_history" ADD CONSTRAINT "purchase_history_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "company_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_history" ADD CONSTRAINT "purchase_history_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_tracking" ADD CONSTRAINT "usage_tracking_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
