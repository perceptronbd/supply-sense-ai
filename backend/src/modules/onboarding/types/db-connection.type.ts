export interface DbCredentials {
  title?: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  sslEnabled?: boolean;
}

export interface QueryResult {
  rows: unknown[];
  rowCount: number;
  fields: unknown[];
}

export interface SaveConnectionResult {
  success: boolean;
  message: string;
  dbConnectionId?: string;
}
