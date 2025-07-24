-- AlterTable
ALTER TABLE "table_metadata" ALTER COLUMN "dataSensitivity" SET NOT NULL,
ALTER COLUMN "dataSensitivity" SET DATA TYPE TEXT;

-- CreateIndex
CREATE INDEX "idx_db_connections_company_id" ON "db_connections"("companyId", "id");

-- CreateIndex
CREATE INDEX "idx_table_metadata_db_connection" ON "table_metadata"("dbConnectionId", "id");

-- CreateIndex
CREATE INDEX "idx_table_relations_db_connection" ON "table_relations"("dbConnectionId", "id");
