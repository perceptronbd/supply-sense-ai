-- CreateEnum
CREATE TYPE "public"."PermissionModule" AS ENUM ('USERS', 'COMPANIES', 'BRANCHES', 'ITEMS', 'SUPPLIERS', 'FORMULAS', 'PURCHASE_REQUESTS', 'PURCHASE_ORDERS', 'MATERIAL_REQUISITIONS', 'REQUEST_FORMS', 'MANUFACTURING_LISTS', 'GOODS_RECEIPTS', 'ROLES', 'PERMISSIONS', 'AI', 'CHAT');

-- CreateEnum
CREATE TYPE "public"."PermissionAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SUBMIT', 'CANCEL', 'EXPORT', 'IMPORT', 'MANAGE', 'MANAGE_ROLES', 'MANAGE_PERMISSIONS', 'LOGIN', 'LOGOUT', 'REFRESH', 'REGISTER', 'ACCESS_SUGGESTIONS', 'MANAGE_SUGGESTIONS', 'DEMAND_FORECASTING', 'ANALYTICS', 'SEND_MESSAGE', 'READ_MESSAGES', 'MANAGE_CONVERSATIONS');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "public"."BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "public"."SubscriptionPlans" AS ENUM ('TRIAL', 'STARTER', 'BUSINESS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."ResourceType" AS ENUM ('API_REQUEST', 'CHAT');

-- CreateTable
CREATE TABLE "public"."companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "businessAddress" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "industry" TEXT,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permissions" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" "public"."PermissionAction" NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "governmentId" TEXT,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."schema_cache" (
    "id" TEXT NOT NULL,
    "schema" JSONB NOT NULL,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dbConnectionId" TEXT NOT NULL,

    CONSTRAINT "schema_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."db_connections" (
    "id" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "database" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "title" TEXT,
    "businessContext" TEXT DEFAULT '',
    "encryptedPassword" TEXT NOT NULL,
    "sslEnabled" BOOLEAN NOT NULL DEFAULT false,
    "connectionHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "db_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."table_relations" (
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
CREATE TABLE "public"."table_metadata" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "friendlyLabel" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "updateFrequency" TEXT NOT NULL,
    "dataSensitivity" TEXT NOT NULL,
    "sampleQuestions" TEXT[],
    "dbConnectionId" TEXT NOT NULL,

    CONSTRAINT "table_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscription_plans" (
    "id" TEXT NOT NULL,
    "name" "public"."SubscriptionPlans" NOT NULL DEFAULT 'TRIAL',
    "priceMonthly" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "credits" DECIMAL(65,30) NOT NULL,
    "priceYearly" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "apiRequestsLimit" INTEGER NOT NULL DEFAULT 0,
    "roleBasedAccess" BOOLEAN NOT NULL DEFAULT false,
    "advancedFiltering" BOOLEAN NOT NULL DEFAULT false,
    "bulkImportExport" BOOLEAN NOT NULL DEFAULT false,
    "apiAccess" BOOLEAN NOT NULL DEFAULT false,
    "prioritySupport" BOOLEAN NOT NULL DEFAULT false,
    "customIntegrations" BOOLEAN NOT NULL DEFAULT false,
    "dedicatedManager" BOOLEAN NOT NULL DEFAULT false,
    "privateModelTuning" BOOLEAN NOT NULL DEFAULT false,
    "slaUptimeGuarantee" BOOLEAN NOT NULL DEFAULT false,
    "earlyBetaAccess" BOOLEAN NOT NULL DEFAULT false,
    "quarterlyReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."usage_record" (
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

    CONSTRAINT "usage_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_subscriptions" (
    "id" TEXT NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL,
    "billingCycle" "public"."BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "startPeriod" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endPeriod" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalCredits" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remainingCredits" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "stripeSubscriptionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "subscriptionPlanId" TEXT NOT NULL,

    CONSTRAINT "company_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_subscription_history" (
    "id" TEXT NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL,
    "billingCycle" "public"."BillingCycle" NOT NULL DEFAULT 'MONTHLY',
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

-- CreateTable
CREATE TABLE "public"."purchase_history" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentStatus" "public"."PaymentStatus" NOT NULL,
    "stripePaymentIntentId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "companySubscriptionHistoryId" TEXT NOT NULL,

    CONSTRAINT "purchase_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."usage_tracking" (
    "id" TEXT NOT NULL,
    "resourceType" "public"."ResourceType" NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "usage_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "dbConnectionId" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversation_states" (
    "id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "entities" JSONB NOT NULL,
    "state" JSONB,
    "topics" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "conversation_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_taxId_key" ON "public"."companies"("taxId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_contactEmail_key" ON "public"."companies"("contactEmail");

-- CreateIndex
CREATE INDEX "idx_company_name" ON "public"."companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_companyId_name_key" ON "public"."roles"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_module_action_key" ON "public"."permissions"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "public"."role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_key" ON "public"."user_roles"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "schema_cache_dbConnectionId_key" ON "public"."schema_cache"("dbConnectionId");

-- CreateIndex
CREATE UNIQUE INDEX "db_connections_connectionHash_key" ON "public"."db_connections"("connectionHash");

-- CreateIndex
CREATE INDEX "idx_db_connections_company_id" ON "public"."db_connections"("companyId", "id");

-- CreateIndex
CREATE INDEX "idx_db_connections_username" ON "public"."db_connections"("username");

-- CreateIndex
CREATE UNIQUE INDEX "db_connections_companyId_username_key" ON "public"."db_connections"("companyId", "username");

-- CreateIndex
CREATE INDEX "idx_table_relations_table_column" ON "public"."table_relations"("tableName", "columnName");

-- CreateIndex
CREATE INDEX "idx_table_relations_db_connection" ON "public"."table_relations"("dbConnectionId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "table_relations_dbConnectionId_tableName_columnName_key" ON "public"."table_relations"("dbConnectionId", "tableName", "columnName");

-- CreateIndex
CREATE INDEX "idx_table_metadata_db_connection" ON "public"."table_metadata"("dbConnectionId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "table_metadata_dbConnectionId_tableName_key" ON "public"."table_metadata"("dbConnectionId", "tableName");

-- CreateIndex
CREATE INDEX "idx_subscription_plan_name" ON "public"."subscription_plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "company_subscriptions_stripeSubscriptionId_key" ON "public"."company_subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "company_subscriptions_companyId_key" ON "public"."company_subscriptions"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "company_subscription_history_stripeSubscriptionId_key" ON "public"."company_subscription_history"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "idx_purchase_history_payment_status" ON "public"."purchase_history"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_states_sessionId_key" ON "public"."conversation_states"("sessionId");

-- AddForeignKey
ALTER TABLE "public"."roles" ADD CONSTRAINT "roles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schema_cache" ADD CONSTRAINT "schema_cache_dbConnectionId_fkey" FOREIGN KEY ("dbConnectionId") REFERENCES "public"."db_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."db_connections" ADD CONSTRAINT "db_connections_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."table_relations" ADD CONSTRAINT "table_relations_dbConnectionId_fkey" FOREIGN KEY ("dbConnectionId") REFERENCES "public"."db_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."table_metadata" ADD CONSTRAINT "table_metadata_dbConnectionId_fkey" FOREIGN KEY ("dbConnectionId") REFERENCES "public"."db_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usage_record" ADD CONSTRAINT "usage_record_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_subscriptions" ADD CONSTRAINT "company_subscriptions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_subscriptions" ADD CONSTRAINT "company_subscriptions_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "public"."subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_subscription_history" ADD CONSTRAINT "company_subscription_history_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_subscription_history" ADD CONSTRAINT "company_subscription_history_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "public"."subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_history" ADD CONSTRAINT "purchase_history_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."company_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_history" ADD CONSTRAINT "purchase_history_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_history" ADD CONSTRAINT "purchase_history_companySubscriptionHistoryId_fkey" FOREIGN KEY ("companySubscriptionHistoryId") REFERENCES "public"."company_subscription_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usage_tracking" ADD CONSTRAINT "usage_tracking_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_dbConnectionId_fkey" FOREIGN KEY ("dbConnectionId") REFERENCES "public"."db_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversation_states" ADD CONSTRAINT "conversation_states_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
