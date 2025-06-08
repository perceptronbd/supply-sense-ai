import { Decimal } from '@prisma/client/runtime/library';

export class Formula {
  id: string;
  name: string;
  code: string;
  description: string | null;
  version: string;
  outputItem: string | null;
  outputQuantity: Decimal;
  isActive: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export class FormulaItem {
  id: string;
  formulaId: string;
  itemId: string;
  quantity: Decimal;
  remarks: string | null;
}
