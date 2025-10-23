/*
  Warnings:

  - You are about to drop the column `limitWindowName` on the `api_logs` table. All the data in the column will be lost.
  - You are about to drop the column `limitWindowTime` on the `api_logs` table. All the data in the column will be lost.
  - You are about to drop the column `maxRequests` on the `api_logs` table. All the data in the column will be lost.
  - Added the required column `rateLimitConfig` to the `api_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "api_logs" DROP COLUMN "limitWindowName",
DROP COLUMN "limitWindowTime",
DROP COLUMN "maxRequests",
ADD COLUMN     "rateLimitConfig" JSONB NOT NULL;
