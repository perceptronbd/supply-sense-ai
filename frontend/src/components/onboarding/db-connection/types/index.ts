interface IDbCredential {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  sslEnabled: boolean;
}

export interface IDbConnectPayload {
  companyId: string;
  credentials?: IDbCredential;
  connectionString?: string;
}
