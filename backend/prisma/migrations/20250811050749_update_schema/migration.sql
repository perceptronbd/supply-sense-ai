/*
  Warnings:

  - You are about to drop the column `features` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the `ai_suggestions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `branches` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `formula_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `formulas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `goods_receipts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `gr_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `item_suppliers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `manufacturing_lists` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `material_requisitions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mr_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `po_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pr_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pr_template_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pr_templates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `purchase_orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `purchase_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `request_forms` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rf_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rf_template_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rf_templates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stock` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `suppliers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_branches` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ai_suggestions" DROP CONSTRAINT "ai_suggestions_companyId_fkey";

-- DropForeignKey
ALTER TABLE "ai_suggestions" DROP CONSTRAINT "ai_suggestions_userId_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_companyId_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "branches" DROP CONSTRAINT "branches_companyId_fkey";

-- DropForeignKey
ALTER TABLE "formula_items" DROP CONSTRAINT "formula_items_formulaId_fkey";

-- DropForeignKey
ALTER TABLE "formula_items" DROP CONSTRAINT "formula_items_itemId_fkey";

-- DropForeignKey
ALTER TABLE "formulas" DROP CONSTRAINT "formulas_companyId_fkey";

-- DropForeignKey
ALTER TABLE "formulas" DROP CONSTRAINT "formulas_createdById_fkey";

-- DropForeignKey
ALTER TABLE "goods_receipts" DROP CONSTRAINT "goods_receipts_branchId_fkey";

-- DropForeignKey
ALTER TABLE "goods_receipts" DROP CONSTRAINT "goods_receipts_companyId_fkey";

-- DropForeignKey
ALTER TABLE "goods_receipts" DROP CONSTRAINT "goods_receipts_mrId_fkey";

-- DropForeignKey
ALTER TABLE "goods_receipts" DROP CONSTRAINT "goods_receipts_poId_fkey";

-- DropForeignKey
ALTER TABLE "goods_receipts" DROP CONSTRAINT "goods_receipts_receivedById_fkey";

-- DropForeignKey
ALTER TABLE "gr_items" DROP CONSTRAINT "gr_items_grId_fkey";

-- DropForeignKey
ALTER TABLE "gr_items" DROP CONSTRAINT "gr_items_itemId_fkey";

-- DropForeignKey
ALTER TABLE "item_suppliers" DROP CONSTRAINT "item_suppliers_itemId_fkey";

-- DropForeignKey
ALTER TABLE "item_suppliers" DROP CONSTRAINT "item_suppliers_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "items" DROP CONSTRAINT "items_companyId_fkey";

-- DropForeignKey
ALTER TABLE "manufacturing_lists" DROP CONSTRAINT "manufacturing_lists_branchId_fkey";

-- DropForeignKey
ALTER TABLE "manufacturing_lists" DROP CONSTRAINT "manufacturing_lists_companyId_fkey";

-- DropForeignKey
ALTER TABLE "manufacturing_lists" DROP CONSTRAINT "manufacturing_lists_createdById_fkey";

-- DropForeignKey
ALTER TABLE "manufacturing_lists" DROP CONSTRAINT "manufacturing_lists_formulaId_fkey";

-- DropForeignKey
ALTER TABLE "material_requisitions" DROP CONSTRAINT "material_requisitions_companyId_fkey";

-- DropForeignKey
ALTER TABLE "material_requisitions" DROP CONSTRAINT "material_requisitions_createdById_fkey";

-- DropForeignKey
ALTER TABLE "material_requisitions" DROP CONSTRAINT "material_requisitions_fromBranchId_fkey";

-- DropForeignKey
ALTER TABLE "material_requisitions" DROP CONSTRAINT "material_requisitions_rfId_fkey";

-- DropForeignKey
ALTER TABLE "material_requisitions" DROP CONSTRAINT "material_requisitions_toBranchId_fkey";

-- DropForeignKey
ALTER TABLE "mr_items" DROP CONSTRAINT "mr_items_itemId_fkey";

-- DropForeignKey
ALTER TABLE "mr_items" DROP CONSTRAINT "mr_items_mrId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_companyId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_userId_fkey";

-- DropForeignKey
ALTER TABLE "po_items" DROP CONSTRAINT "po_items_itemId_fkey";

-- DropForeignKey
ALTER TABLE "po_items" DROP CONSTRAINT "po_items_poId_fkey";

-- DropForeignKey
ALTER TABLE "pr_items" DROP CONSTRAINT "pr_items_itemId_fkey";

-- DropForeignKey
ALTER TABLE "pr_items" DROP CONSTRAINT "pr_items_prId_fkey";

-- DropForeignKey
ALTER TABLE "pr_template_items" DROP CONSTRAINT "pr_template_items_itemId_fkey";

-- DropForeignKey
ALTER TABLE "pr_template_items" DROP CONSTRAINT "pr_template_items_templateId_fkey";

-- DropForeignKey
ALTER TABLE "pr_templates" DROP CONSTRAINT "pr_templates_companyId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_orders" DROP CONSTRAINT "purchase_orders_branchId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_orders" DROP CONSTRAINT "purchase_orders_companyId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_orders" DROP CONSTRAINT "purchase_orders_createdById_fkey";

-- DropForeignKey
ALTER TABLE "purchase_orders" DROP CONSTRAINT "purchase_orders_prId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_orders" DROP CONSTRAINT "purchase_orders_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_requests" DROP CONSTRAINT "purchase_requests_branchId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_requests" DROP CONSTRAINT "purchase_requests_companyId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_requests" DROP CONSTRAINT "purchase_requests_createdById_fkey";

-- DropForeignKey
ALTER TABLE "purchase_requests" DROP CONSTRAINT "purchase_requests_prTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "request_forms" DROP CONSTRAINT "request_forms_companyId_fkey";

-- DropForeignKey
ALTER TABLE "request_forms" DROP CONSTRAINT "request_forms_createdById_fkey";

-- DropForeignKey
ALTER TABLE "request_forms" DROP CONSTRAINT "request_forms_fromBranchId_fkey";

-- DropForeignKey
ALTER TABLE "request_forms" DROP CONSTRAINT "request_forms_rfTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "request_forms" DROP CONSTRAINT "request_forms_toBranchId_fkey";

-- DropForeignKey
ALTER TABLE "rf_items" DROP CONSTRAINT "rf_items_itemId_fkey";

-- DropForeignKey
ALTER TABLE "rf_items" DROP CONSTRAINT "rf_items_rfId_fkey";

-- DropForeignKey
ALTER TABLE "rf_template_items" DROP CONSTRAINT "rf_template_items_itemId_fkey";

-- DropForeignKey
ALTER TABLE "rf_template_items" DROP CONSTRAINT "rf_template_items_templateId_fkey";

-- DropForeignKey
ALTER TABLE "rf_templates" DROP CONSTRAINT "rf_templates_companyId_fkey";

-- DropForeignKey
ALTER TABLE "stock" DROP CONSTRAINT "stock_branchId_fkey";

-- DropForeignKey
ALTER TABLE "stock" DROP CONSTRAINT "stock_itemId_fkey";

-- DropForeignKey
ALTER TABLE "suppliers" DROP CONSTRAINT "suppliers_companyId_fkey";

-- DropForeignKey
ALTER TABLE "user_branches" DROP CONSTRAINT "user_branches_branchId_fkey";

-- DropForeignKey
ALTER TABLE "user_branches" DROP CONSTRAINT "user_branches_userId_fkey";

-- AlterTable
ALTER TABLE "subscription_plans" DROP COLUMN "features";

-- DropTable
DROP TABLE "ai_suggestions";

-- DropTable
DROP TABLE "audit_logs";

-- DropTable
DROP TABLE "branches";

-- DropTable
DROP TABLE "formula_items";

-- DropTable
DROP TABLE "formulas";

-- DropTable
DROP TABLE "goods_receipts";

-- DropTable
DROP TABLE "gr_items";

-- DropTable
DROP TABLE "item_suppliers";

-- DropTable
DROP TABLE "items";

-- DropTable
DROP TABLE "manufacturing_lists";

-- DropTable
DROP TABLE "material_requisitions";

-- DropTable
DROP TABLE "mr_items";

-- DropTable
DROP TABLE "notifications";

-- DropTable
DROP TABLE "po_items";

-- DropTable
DROP TABLE "pr_items";

-- DropTable
DROP TABLE "pr_template_items";

-- DropTable
DROP TABLE "pr_templates";

-- DropTable
DROP TABLE "purchase_orders";

-- DropTable
DROP TABLE "purchase_requests";

-- DropTable
DROP TABLE "request_forms";

-- DropTable
DROP TABLE "rf_items";

-- DropTable
DROP TABLE "rf_template_items";

-- DropTable
DROP TABLE "rf_templates";

-- DropTable
DROP TABLE "stock";

-- DropTable
DROP TABLE "suppliers";

-- DropTable
DROP TABLE "user_branches";

-- DropEnum
DROP TYPE "AISuggestionType";

-- DropEnum
DROP TYPE "GRStatus";

-- DropEnum
DROP TYPE "MLStatus";

-- DropEnum
DROP TYPE "MRStatus";

-- DropEnum
DROP TYPE "MRType";

-- DropEnum
DROP TYPE "NotificationType";

-- DropEnum
DROP TYPE "POStatus";

-- DropEnum
DROP TYPE "PRStatus";

-- DropEnum
DROP TYPE "Priority";

-- DropEnum
DROP TYPE "RFStatus";

-- DropEnum
DROP TYPE "SuggestionStatus";
