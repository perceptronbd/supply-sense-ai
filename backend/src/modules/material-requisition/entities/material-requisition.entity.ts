import type { Decimal } from '@prisma/client/runtime/library';

export class MaterialRequisition {
  id: string;
  mrNumber: string;
  title: string | null;
  rfId: string | null;
  type: string;
  fromBranchId: string | null;
  toBranchId: string | null;
  branchId: string | null;
  status: string;
  mrDate: Date;
  transferDate: Date | null;
  createdById: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class MRItem {
  id: string;
  mrId: string;
  itemId: string;
  quantity: Decimal;
  wasteType: string | null;
  remarks: string | null;
  createdAt: Date;
}
