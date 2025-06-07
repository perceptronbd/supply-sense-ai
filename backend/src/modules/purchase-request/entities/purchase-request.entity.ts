import type { Decimal } from '@prisma/client/runtime/library';

export class PurchaseRequest {
  id: string;
  prNumber: string;
  title: string | null;
  description: string | null;
  status: string;
  requestDate: Date;
  requiredDate: Date;
  approvedDate: Date | null;
  totalAmount: Decimal;
  branchId: string;
  createdById: string;
  prTemplateId: string | null;
  justification: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PRItem {
  id: string;
  prId: string;
  itemId: string;
  requestedQty: Decimal;
  estimatedPrice: Decimal;
  totalAmount: Decimal;
  requiredDate: Date;
  remarks: string | null;
  createdAt: Date;
}
