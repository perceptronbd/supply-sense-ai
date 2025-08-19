import type { ApiResponse } from '@supplysense/types';

interface IDbCredential {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  sslEnabled: boolean;
}

export interface IDbConnectPayload {
  title: string;
  businessContext: string;
  companyId: string;
  credentials?: IDbCredential;
  connectionString?: string;
}

export type TDbConnectionResponse = ApiResponse<{
  dbConnectionId: string;
}>;
