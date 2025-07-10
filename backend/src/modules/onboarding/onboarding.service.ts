import { PrismaService } from '@/app/prisma.service';
import { Inject, Injectable } from '@nestjs/common';
import { type CaptureMetadataDto, SaveDbConnectionDto } from './dto/db-connect.dto';
import {
  closeAllConnections,
  decryptPassword,
  encryptPassword,
  formatTableName,
  generateConnectionHash,
  testConnection,
  withDbConnection,
} from './helpers/db-connection.helper';
import type { DbCredentials, SaveConnectionResult } from './types/db-connection.type';

@Injectable()
export class OnboardingService {
  private readonly encryptionKey: string;

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    // Use environment variable for encryption key
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

      // Test connection first
      const isConnected = await testConnection(dto.credentials);
      if (!isConnected) {
        return {
          success: false,
          message: 'Cannot save connection - connection test failed',
        };
      }

      // Encrypt password
      const encryptedPassword = encryptPassword(dto.credentials.password, this.encryptionKey);

      // Generate connection hash
      const connectionHash = generateConnectionHash(dto.credentials);

      // Save to database
      const savedConnection = await this.prisma.dbConnection.create({
        data: {
          companyId: dto.companyId,
          host: dto.credentials.host,
          port: dto.credentials.port,
          database: dto.credentials.database,
          username: dto.credentials.username,
          encryptedPassword,
          title: dto.credentials.title || dto.credentials.database, // Use database name as default title
          sslEnabled: dto.credentials.sslEnabled || false,
          connectionHash,
        },
      });

      return {
        success: true,
        message: 'Connection saved successfully',
        connectionId: savedConnection.id,
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

  /*
   * Retrieve the schema of the database tables for a specific company
   * This method connects to the database and retrieves the table names from the public schema.
   */

  async getTables(companyId: string, connectionId?: string) {
    const connections = await this.getDbConnections(companyId);

    if (connections.length === 0) {
      throw new Error('No database connections found for this company');
    }

    // If connectionId is provided, use that specific connection
    if (connectionId) {
      const connection = connections.find((conn) => conn.id === connectionId);
      if (!connection) {
        throw new Error('Specified database connection not found');
      }
      return this.getTablesForConnection(connection);
    }

    // Otherwise, get tables from all connections
    const allTables = {
      connectionId: '',
      tables: [] as Array<{ tableName: string; displayName: string }>,
    };
    for (const connection of connections) {
      const data = await this.getTablesForConnection(connection);
      allTables.connectionId = connection.id;
      allTables.tables = data.tables;
    }

    return allTables;
  }

  private async getTablesForConnection(connection: DbCredentials & { id: string; title?: string }) {
    return withDbConnection(connection, async (client) => {
      const result = await client.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
      );
      // Transform the result to include human-readable table names
      const data = {
        connectionId: connection.id,
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

  async captureMetadata(dto: CaptureMetadataDto) {
    const connections = await this.getDbConnections(dto.companyId);

    if (connections.length === 0) {
      throw new Error('No database connections found for this company');
    }

    // If connectionId is provided, use that specific connection
    if (!dto.connectionId) {
      throw new Error('No connectionId provided');
    }

    const connection = connections.find((conn) => conn.id === dto.connectionId);
    if (!connection) {
      throw new Error('Specified database connection not found');
    }
    return this.captureMetadataForConnection(connection, dto.tables);
  }

  private async captureMetadataForConnection(
    connection: DbCredentials & { id: string; title?: string },
    tables: Array<{ tableName: string }>
  ) {
    return withDbConnection(connection, async (client) => {
      // Extract table names from the tables array
      const tableNames = tables.map((table) => table.tableName);

      // Use parameterized query to prevent SQL injection
      const query = {
        text: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ANY($1::text[])
        `,
        values: [tableNames],
      };

      const result = await client.query(query);
      return {
        connectionId: connection.id,
        connectionTitle: connection.title || 'Default Connection',
        tables: result.rows,
      };
    });
  }

  /**
   * Get database connection for a company
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

      return connections.map((connection) => ({
        ...connection,
        id: connection.id,
        title: connection.title,
        password: decryptPassword(connection.encryptedPassword, this.encryptionKey),
      }));
    } catch (error) {
      console.error('Failed to retrieve database connections:', error);
      throw new Error('Failed to retrieve database connections');
    }
  }

  /**
   * Clean up on application shutdown
   */
  async onModuleDestroy(): Promise<void> {
    await closeAllConnections();
  }
}
