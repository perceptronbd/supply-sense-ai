import { Decimal } from '@prisma/client/runtime/library';

export class RequestForm {
  id: string;
  rfNumber: string;
  title: string | null;
  description: string | null;
  status: string;
  fromBranchId: string;
  toBranchId: string;
  requestDate: Date;
  requiredDate: Date;
  approvedDate: Date | null;
  createdById: string;
  rfTemplateId: string | null;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class RFItem {
  id: string;
  rfId: string;
  itemId: string;
  requestedQty: Decimal;
  remarks: string | null;
  createdAt: Date;
}
