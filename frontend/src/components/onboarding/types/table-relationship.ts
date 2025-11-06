import type { TActionButtonVariants } from '@supplysense/constant';
import type { ApiResponse } from '@supplysense/types';

export interface IRelationshipTables {
  tableName: string;
  columnName: string;
  refTable: string;
  refColumn: string;
  description: string;
  isConfirmed: boolean;
  actionVariant: TActionButtonVariants; // The action button variant that was clicked
}

export type TRelationshipTablesResponse = ApiResponse<IRelationshipTables[]>;

export interface IUpsertTableRelationshipsPayload {
  relationships: IRelationshipTables[];
  companyId: string;
  dbConnectionId: string;
}
