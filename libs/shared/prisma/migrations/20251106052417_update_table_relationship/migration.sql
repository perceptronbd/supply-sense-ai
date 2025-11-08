/*
  Warnings:

  - You are about to drop the column `actionVariant` on the `table_relations` table. All the data in the column will be lost.
  - You are about to drop the column `columnName` on the `table_relations` table. All the data in the column will be lost.
  - You are about to drop the column `isConfirmed` on the `table_relations` table. All the data in the column will be lost.
  - You are about to drop the column `refColumn` on the `table_relations` table. All the data in the column will be lost.
  - You are about to drop the column `refTable` on the `table_relations` table. All the data in the column will be lost.
  - You are about to drop the column `tableName` on the `table_relations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[dbConnectionId]` on the table `table_relations` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."idx_table_relations_table_column";

-- DropIndex
DROP INDEX "public"."table_relations_dbConnectionId_tableName_columnName_key";

-- AlterTable
ALTER TABLE "table_relations" DROP COLUMN "actionVariant",
DROP COLUMN "columnName",
DROP COLUMN "isConfirmed",
DROP COLUMN "refColumn",
DROP COLUMN "refTable",
DROP COLUMN "tableName",
ADD COLUMN     "relationships" JSONB NOT NULL DEFAULT '[]';

-- CreateIndex
CREATE UNIQUE INDEX "table_relations_dbConnectionId_key" ON "table_relations"("dbConnectionId");
