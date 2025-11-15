/*
  Warnings:

  - You are about to drop the column `displayName` on the `onboarding_selected_tables` table. All the data in the column will be lost.
  - You are about to drop the column `tableName` on the `onboarding_selected_tables` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[dbConnectionId,companyId]` on the table `onboarding_selected_tables` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."onboarding_selected_tables_dbConnectionId_tableName_company_key";

-- AlterTable
ALTER TABLE "onboarding_selected_tables" DROP COLUMN "displayName",
DROP COLUMN "tableName",
ADD COLUMN     "tables" JSONB NOT NULL DEFAULT '[]';

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_selected_tables_dbConnectionId_companyId_key" ON "onboarding_selected_tables"("dbConnectionId", "companyId");
