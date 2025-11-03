import type { ITableDiscoverySelection } from './table-discovery-selection';

export interface IUpdateBusinessContextPayload {
  dbConnectionId: string;
  companyId: string;
  title: string;
  businessContext: string;
  tables: ITableDiscoverySelection['tables'];
}
