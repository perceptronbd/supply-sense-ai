import { Decimal } from '@prisma/client/runtime/library';
import { type PrismaClient } from '@supplysense/prisma-client';

/**
 * Prisma transaction type for database operations
 */
export type PrismaTransaction = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

/**
 * Query filter types for where clauses
 */
export interface QueryFilter {
  [key: string]: string | number | boolean | Date | null | undefined;
}

/**
 * Manufacturing list query filter
 */
export interface MLQueryFilter {
  branchId?: string;
  status?: string;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
}

/**
 * Material requisition query filter
 */
export interface MRQueryFilter {
  branchId?: string;
  type?: string;
  OR?: Array<{
    fromBranchId?: string;
    toBranchId?: string;
    branchId?: string;
  }>;
}

/**
 * Item interface for deduction operations
 */
export interface ItemForDeduction {
  id: string;
  name: string;
  sku: string;
  transferUnit: string;
  mainUnit: string;
  transferToMainRate: Decimal;
}
