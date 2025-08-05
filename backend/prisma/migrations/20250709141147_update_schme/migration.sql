/*
  Warnings:

  - A unique constraint covering the columns `[companyId]` on the table `db_connections` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "db_connections_companyId_key" ON "db_connections"("companyId");
