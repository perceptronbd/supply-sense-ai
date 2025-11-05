import type { ApiResponse } from '@supplysense/types';
import type { TActionButtonVariants } from '../relationship-confirmation/ActionButton';

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
