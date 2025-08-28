// Database connection interface
export interface DatabaseConnection {
  id: string;
  title?: string;
  host: string;
  port: number;
  database: string;
  username: string;
  sslEnabled?: boolean;
}
