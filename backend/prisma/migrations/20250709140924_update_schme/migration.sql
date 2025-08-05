/*
  Warnings:

  - You are about to drop the column `businessContext` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `schema_cache` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[dbConnectionId]` on the table `schema_cache` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dbConnectionId` to the `schema_cache` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "schema_cache" DROP CONSTRAINT "schema_cache_companyId_fkey";

-- DropIndex
DROP INDEX "db_connections_companyId_key";

-- DropIndex
DROP INDEX "idx_schema_cache_company_id";

-- DropIndex
DROP INDEX "schema_cache_companyId_key";

-- AlterTable
ALTER TABLE "companies" DROP COLUMN "businessContext";

-- AlterTable
ALTER TABLE "db_connections" ADD COLUMN     "businessContext" TEXT DEFAULT '',
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "schema_cache" DROP COLUMN "companyId",
ADD COLUMN     "dbConnectionId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "schema_cache_dbConnectionId_key" ON "schema_cache"("dbConnectionId");

-- CreateIndex
CREATE INDEX "idx_schema_cache_db_connection" ON "schema_cache"("dbConnectionId");

-- AddForeignKey
ALTER TABLE "schema_cache" ADD CONSTRAINT "schema_cache_dbConnectionId_fkey" FOREIGN KEY ("dbConnectionId") REFERENCES "db_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
