import type { ApiResponse } from '@supplysense/types';

export interface IRelationshipTables {
  tableName: string;
  columnName: string;
  refTable: string;
  refColumn: string;
  description: string;
  isConfirmed: boolean;
}

export type TRelationshipTablesResponse = ApiResponse<IRelationshipTables[]>;

export interface IUpsertTableRelationshipsPayload {
  relationships: IRelationshipTables[];
  companyId: string;
  dbConnectionId: string;
}
