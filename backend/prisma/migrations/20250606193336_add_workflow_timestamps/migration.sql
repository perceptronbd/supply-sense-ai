-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "sentToSupplierAt" TIMESTAMP(3);
