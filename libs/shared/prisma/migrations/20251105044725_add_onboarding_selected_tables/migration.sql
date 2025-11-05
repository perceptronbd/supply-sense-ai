-- AlterTable
ALTER TABLE "table_relations" ADD COLUMN     "actionVariant" TEXT;

-- CreateTable
CREATE TABLE "onboarding_selected_tables" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "displayName" TEXT,
    "dbConnectionId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_selected_tables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "onboarding_selected_tables_dbConnectionId_idx" ON "onboarding_selected_tables"("dbConnectionId");

-- CreateIndex
CREATE INDEX "onboarding_selected_tables_companyId_idx" ON "onboarding_selected_tables"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_selected_tables_dbConnectionId_tableName_company_key" ON "onboarding_selected_tables"("dbConnectionId", "tableName", "companyId");

-- AddForeignKey
ALTER TABLE "onboarding_selected_tables" ADD CONSTRAINT "onboarding_selected_tables_dbConnectionId_fkey" FOREIGN KEY ("dbConnectionId") REFERENCES "db_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_selected_tables" ADD CONSTRAINT "onboarding_selected_tables_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
