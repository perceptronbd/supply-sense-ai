import { Decimal } from '@prisma/client/runtime/library';

export class PurchaseOrder {
  id: string;
  poNumber: string;
  title: string | null;
  prId: string | null;
  supplierId: string;
  status: string;
  orderDate: Date;
  expectedDeliveryDate: Date;
  confirmedDate: Date | null;
  subtotal: Decimal;
  taxAmount: Decimal;
  totalAmount: Decimal;
  paymentTerms: string | null;
  deliveryTerms: string | null;
  branchId: string;
  createdById: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class POItem {
  id: string;
  poId: string;
  itemId: string;
  orderedQty: Decimal;
  receivedQty: Decimal;
  unitPrice: Decimal;
  totalAmount: Decimal;
  deliveryDate: Date;
  remarks: string | null;
  createdAt: Date;
}
