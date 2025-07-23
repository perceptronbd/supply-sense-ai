import { PrismaService } from '@/app/prisma.service';
import { Inject, Injectable } from '@nestjs/common';
import {
  decryptPassword,
  encryptPassword,
  formatTableName,
  generateConnectionHash,
  parseConnectionString,
  testConnection,
  withDbConnection,
} from 'src/helpers/db-connection.helper';
import type { SaveDbConnectionDto } from '../onboarding/dto/db-connect.dto';
import type { DbCredentials, SaveConnectionResult } from '../onboarding/types/db-connection.type';

@Injectable()
export class ConnectionsService {
  private readonly encryptionKey: string;

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    this.encryptionKey = process.env.DB_ENCRYPTION_KEY;
    if (!this.encryptionKey) {
      throw new Error('DB_ENCRYPTION_KEY environment variable is not set');
    }
  }

  /**
   * Save database connection with full validation and error handling
   */
  async saveDbConnection(dto: SaveDbConnectionDto): Promise<SaveConnectionResult> {
    try {
      // Validate that the company exists
      const company = await this.prisma.company.findUnique({
        where: { id: dto.companyId },
      });

      if (!company) {
        return {
          success: false,
          message: 'Company not found',
        };
      }

      if (!company.isActive) {
        return {
          success: false,
          message: 'Cannot create connection for inactive company',
        };
      }

      // Check if connection already exists for this company
      const existingConnection = await this.prisma.dbConnection.findUnique({
        where: { companyId: dto.companyId },
      });

      if (existingConnection) {
        return {
          success: false,
          message: 'Database connection already exists for this company',
        };
      }

      // Parse credentials from either connection string or credentials object
      let credentials: DbCredentials;

      if (dto.connectionString) {
        // Parse connection string into credentials
        credentials = parseConnectionString(dto.connectionString);
      } else if (dto.credentials) {
        // Use provided credentials
        credentials = dto.credentials;
      } else {
        return {
          success: false,
          message: 'Either connectionString or credentials must be provided',
        };
      }

      // Test connection first
      const isConnected = await testConnection(credentials);
      if (!isConnected) {
        return {
          success: false,
          message: 'Cannot save connection - connection test failed',
        };
      }

      // Encrypt password
      const encryptedPassword = encryptPassword(credentials.password, this.encryptionKey);

      // Generate connection hash
      const connectionHash = generateConnectionHash(credentials);

      // Save to database
      const savedConnection = await this.prisma.dbConnection.create({
        data: {
          companyId: dto.companyId,
          host: credentials.host,
          port: credentials.port,
          database: credentials.database,
          username: credentials.username,
          encryptedPassword,
          title: credentials.title || credentials.database, // Use database name as default title
          sslEnabled: credentials.sslEnabled || false,
          connectionHash,
        },
      });

      return {
        success: true,
        message: 'Connection saved successfully',
        dbConnectionId: savedConnection.id,
      };
    } catch (error) {
      console.error('Failed to save connection:', error);

      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        return {
          success: false,
          message: 'A database connection with these details already exists',
        };
      }

      if (error.code === 'P2003') {
        return {
          success: false,
          message: 'Invalid company ID - company not found',
        };
      }

      return {
        success: false,
        message: `Failed to save connection: ${error.message}`,
      };
    }
  }

  /**
   * Retrieve a single database connection for a company by connection ID
   * Decrypts the password before returning connection details
   */
  async getCompanyConnection(
    companyId: string,
    dbConnectionId: string
  ): Promise<DbCredentials & { dbConnectionId: string; title?: string }> {
    const connection = await this.prisma.dbConnection.findFirst({
      where: { companyId, id: dbConnectionId },
    });
    if (!connection) {
      throw new Error('Database connection not found');
    }
    // Return connection details with decrypted password
    return {
      host: connection.host,
      port: connection.port,
      database: connection.database,
      username: connection.username,
      password: decryptPassword(connection.encryptedPassword, this.encryptionKey),
      sslEnabled: connection.sslEnabled,
      dbConnectionId: connection.id,
      title: connection.title,
    };
  }

  /**
   * Retrieve all database connections for a company
   * Decrypts passwords for each connection before returning
   */
  async getDbConnections(
    companyId: string
  ): Promise<Array<DbCredentials & { id: string; title?: string }>> {
    try {
      const connections = await this.prisma.dbConnection.findMany({
        where: { companyId },
        select: {
          id: true,
          host: true,
          port: true,
          database: true,
          username: true,
          encryptedPassword: true,
          sslEnabled: true,
          title: true,
        },
      });

      // Map and decrypt password for each connection
      return connections.map((connection) => ({
        ...connection,
        dbConnectionId: connection.id,
        title: connection.title,
        password: decryptPassword(connection.encryptedPassword, this.encryptionKey),
      }));
    } catch (error) {
      console.error('Failed to retrieve database connections:', error);
      throw new Error('Failed to retrieve database connections');
    }
  }

  /**
   * Retrieve all tables for a given database connection
   * Returns table names and human-readable display names
   */
  async getTablesForConnection(connection: DbCredentials & { id: string; title?: string }) {
    return withDbConnection(connection, async (client) => {
      // Query all tables in the public schema
      const result = await client.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
      );
      // Format result to include display names
      const data = {
        dbConnectionId: connection.id,
        tables: [] as Array<{ tableName: string; displayName: string }>,
      };
      for (const row of result.rows) {
        data.tables.push({
          tableName: row.table_name,
          displayName: formatTableName(row.table_name),
        });
      }
      return data;
    });
  }
}
