/*
  Warnings:

  - A unique constraint covering the columns `[dbConnectionId]` on the table `table_relations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "table_relations_dbConnectionId_key" ON "table_relations"("dbConnectionId");
