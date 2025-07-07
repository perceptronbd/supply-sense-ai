/*
  Warnings:

  - The values [VIEW,EDIT] on the enum `PermissionAction` will be removed. If these variants are still used in the database, this will fail.
  - The values [INVENTORY_MANAGEMENT,USER_MANAGEMENT,BRANCH_MANAGEMENT,SUPPLIER_MANAGEMENT,REPORTS,SYSTEM_SETTINGS,AI_SUGGESTIONS] on the enum `PermissionModule` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PermissionAction_new" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SUBMIT', 'CANCEL', 'EXPORT', 'IMPORT', 'MANAGE', 'MANAGE_ROLES', 'MANAGE_PERMISSIONS', 'LOGIN', 'LOGOUT', 'REFRESH', 'REGISTER', 'ACCESS_SUGGESTIONS', 'MANAGE_SUGGESTIONS', 'DEMAND_FORECASTING', 'ANALYTICS', 'SEND_MESSAGE', 'READ_MESSAGES', 'MANAGE_CONVERSATIONS');
ALTER TABLE "permissions" ALTER COLUMN "action" TYPE "PermissionAction_new" USING ("action"::text::"PermissionAction_new");
ALTER TYPE "PermissionAction" RENAME TO "PermissionAction_old";
ALTER TYPE "PermissionAction_new" RENAME TO "PermissionAction";
DROP TYPE "PermissionAction_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PermissionModule_new" AS ENUM ('USERS', 'COMPANIES', 'BRANCHES', 'ITEMS', 'SUPPLIERS', 'FORMULAS', 'PURCHASE_REQUESTS', 'PURCHASE_ORDERS', 'MATERIAL_REQUISITIONS', 'REQUEST_FORMS', 'MANUFACTURING_LISTS', 'GOODS_RECEIPTS', 'AI', 'CHAT');
ALTER TABLE "permissions" ALTER COLUMN "module" TYPE "PermissionModule_new" USING ("module"::text::"PermissionModule_new");
ALTER TYPE "PermissionModule" RENAME TO "PermissionModule_old";
ALTER TYPE "PermissionModule_new" RENAME TO "PermissionModule";
DROP TYPE "PermissionModule_old";
COMMIT;
