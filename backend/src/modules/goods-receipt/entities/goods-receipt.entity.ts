import type { Decimal } from '@prisma/client/runtime/library';

export class GoodsReceipt {
  id: string;
  grNumber: string;
  poId: string | null;
  mrId: string | null;
  receiptDate: Date;
  documentNumber: string | null;
  branchId: string;
  receivedById: string;
  status: string;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class GRItem {
  id: string;
  grId: string;
  itemId: string;
  orderedQty: Decimal;
  receivedQty: Decimal;
  unitPrice: Decimal | null;
  totalCost: Decimal | null;
  qualityNotes: string | null;
  createdAt: Date;
}
