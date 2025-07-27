import type { ApiResponse } from '@supplysense/types';

export interface IGetTablesDto {
  companyId: string;
  dbConnectionId?: string;
}

export interface ITableDiscoverySelection {
  dbConnectionId: string;
  tables: Array<{
    tableName: string; // actual table tableName in DB
    displayName: string; // human-friendly name
  }>;
}

export type TGetTablesResponse = ApiResponse<ITableDiscoverySelection>;
