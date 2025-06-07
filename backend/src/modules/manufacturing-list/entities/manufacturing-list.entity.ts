import type { Decimal } from '@prisma/client/runtime/library';

export class ManufacturingList {
  id: string;
  mlNumber: string;
  title: string | null;
  formulaId: string;
  outputQuantity: Decimal;
  status: string;
  plannedDate: Date;
  startedDate: Date | null;
  completedDate: Date | null;
  branchId: string;
  createdById: string;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
}
