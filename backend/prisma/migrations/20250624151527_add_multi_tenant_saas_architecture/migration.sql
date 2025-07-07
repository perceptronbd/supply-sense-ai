/*
  Warnings:

  - You are about to drop the column `branchId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyId,code]` on the table `branches` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,code]` on the table `formulas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,grNumber]` on the table `goods_receipts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,sku]` on the table `items` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,mlNumber]` on the table `manufacturing_lists` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,mrNumber]` on the table `material_requisitions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,name]` on the table `pr_templates` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,poNumber]` on the table `purchase_orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,prNumber]` on the table `purchase_requests` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,rfNumber]` on the table `request_forms` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,name]` on the table `rf_templates` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,code]` on the table `suppliers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `ai_suggestions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `branches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `formulas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `goods_receipts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `manufacturing_lists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `material_requisitions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `pr_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `purchase_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `purchase_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `request_forms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `rf_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `suppliers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PermissionModule" AS ENUM ('PURCHASE_REQUESTS', 'PURCHASE_ORDERS', 'INVENTORY_MANAGEMENT', 'REQUEST_FORMS', 'MATERIAL_REQUISITIONS', 'GOODS_RECEIPTS', 'FORMULAS', 'MANUFACTURING_LISTS', 'USER_MANAGEMENT', 'BRANCH_MANAGEMENT', 'SUPPLIER_MANAGEMENT', 'REPORTS', 'SYSTEM_SETTINGS', 'AI_SUGGESTIONS');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('CREATE', 'VIEW', 'EDIT', 'DELETE', 'APPROVE', 'REJECT', 'SUBMIT', 'CANCEL', 'EXPORT', 'IMPORT');

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_branchId_fkey";

-- DropIndex
DROP INDEX "formulas_code_key";

-- DropIndex
DROP INDEX "goods_receipts_grNumber_key";

-- DropIndex
DROP INDEX "items_sku_key";

-- DropIndex
DROP INDEX "manufacturing_lists_mlNumber_key";

-- DropIndex
DROP INDEX "material_requisitions_mrNumber_key";

-- DropIndex
DROP INDEX "purchase_orders_poNumber_key";

-- DropIndex
DROP INDEX "purchase_requests_prNumber_key";

-- DropIndex
DROP INDEX "request_forms_rfNumber_key";

-- DropIndex
DROP INDEX "suppliers_code_key";

-- AlterTable
ALTER TABLE "ai_suggestions" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "isHQ" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "formulas" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "goods_receipts" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "manufacturing_lists" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "material_requisitions" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "pr_templates" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "purchase_requests" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "request_forms" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "rf_templates" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "branchId",
DROP COLUMN "role",
ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "governmentId" TEXT,
ADD COLUMN     "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT;

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "businessAddress" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
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
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "module" "PermissionModule" NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_branches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "user_branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_taxId_key" ON "companies"("taxId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_contactEmail_key" ON "companies"("contactEmail");

-- CreateIndex
CREATE UNIQUE INDEX "roles_companyId_name_key" ON "roles"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_module_action_key" ON "permissions"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_key" ON "user_roles"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "user_branches_userId_branchId_key" ON "user_branches"("userId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "branches_companyId_code_key" ON "branches"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "formulas_companyId_code_key" ON "formulas"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipts_companyId_grNumber_key" ON "goods_receipts"("companyId", "grNumber");

-- CreateIndex
CREATE UNIQUE INDEX "items_companyId_sku_key" ON "items"("companyId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturing_lists_companyId_mlNumber_key" ON "manufacturing_lists"("companyId", "mlNumber");

-- CreateIndex
CREATE UNIQUE INDEX "material_requisitions_companyId_mrNumber_key" ON "material_requisitions"("companyId", "mrNumber");

-- CreateIndex
CREATE UNIQUE INDEX "pr_templates_companyId_name_key" ON "pr_templates"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_companyId_poNumber_key" ON "purchase_orders"("companyId", "poNumber");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_requests_companyId_prNumber_key" ON "purchase_requests"("companyId", "prNumber");

-- CreateIndex
CREATE UNIQUE INDEX "request_forms_companyId_rfNumber_key" ON "request_forms"("companyId", "rfNumber");

-- CreateIndex
CREATE UNIQUE INDEX "rf_templates_companyId_name_key" ON "rf_templates"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_companyId_code_key" ON "suppliers"("companyId", "code");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_branches" ADD CONSTRAINT "user_branches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_branches" ADD CONSTRAINT "user_branches_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pr_templates" ADD CONSTRAINT "pr_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_forms" ADD CONSTRAINT "request_forms_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rf_templates" ADD CONSTRAINT "rf_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requisitions" ADD CONSTRAINT "material_requisitions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formulas" ADD CONSTRAINT "formulas_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_lists" ADD CONSTRAINT "manufacturing_lists_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
