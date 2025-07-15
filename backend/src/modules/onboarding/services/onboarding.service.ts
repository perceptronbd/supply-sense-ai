import { PrismaService } from '@/app/prisma.service';
import { Inject, Injectable } from '@nestjs/common';
import type { IDatabaseClient } from '@supplysense/types';
import { SaveDbConnectionDto } from '../dto/db-connect.dto';
import type { TableRelationshipDto } from '../dto/table-relationship.dto';
import {
  closeAllConnections,
  decryptPassword,
  encryptPassword,
  formatTableName,
  generateConnectionHash,
  testConnection,
  withDbConnection,
} from '../helpers/db-connection.helper';
import type { DbCredentials, SaveConnectionResult } from '../types/db-connection.type';

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

  /*
   * Retrieve the schema of the database tables for a specific company
   * This method connects to the database and retrieves the table names from the public schema.
   */

  async getTables(companyId: string, dbConnectionId?: string) {
    const connections = await this.getDbConnections(companyId);

    if (connections.length === 0) {
      throw new Error('No database connections found for this company');
    }

    // If dbConnectionId is provided, use that specific connection
    if (dbConnectionId) {
      const connection = connections.find((conn) => conn.id === dbConnectionId);
      if (!connection) {
        throw new Error('Specified database connection not found');
      }
      return this.getTablesForConnection(connection);
    }

    // Otherwise, get tables from all connections
    const allTables = {
      dbConnectionId: '',
      tables: [] as Array<{ tableName: string; displayName: string }>,
    };
    for (const connection of connections) {
      const data = await this.getTablesForConnection(connection);
      allTables.dbConnectionId = connection.id;
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
  /**
   * Get database connection for a company by ID
   */
  async getCompanyConnection(companyId: string, dbConnectionId: string) {
    // Find the company's database connection
    const connection = await this.prisma.dbConnection.findFirst({
      where: { companyId, id: dbConnectionId },
    });
    if (!connection) {
      throw new Error('Database connection not found');
    }

    // Prepare DbCredentials object with decrypted password
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
   * Get table relationships for a company's database connection
   */
  async getTableRelationships(companyId: string, dbConnectionId: string) {
    try {
      // Find the company's database connection
      const connection = await this.getCompanyConnection(companyId, dbConnectionId);
      // Prepare DbCredentials object with decrypted password

      // Query foreign key relationships from the database
      return await withDbConnection(connection, async (client: IDatabaseClient) => {
        const { rows } = await client.query({
          text: `
            SELECT
              tc.table_name AS foreign_table,
              kcu.column_name AS foreign_column,
              ccu.table_name AS primary_table,
              ccu.column_name AS primary_column
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
            WHERE constraint_type = 'FOREIGN KEY'
              AND tc.table_schema = $1;
          `,
          values: ['public'], // Using public schema by default
        });

        // Format the results to match our DTO
        return rows.map((row) => ({
          tableName: row.foreign_table as string,
          columnName: row.foreign_column as string,
          refTable: row.primary_table as string,
          refColumn: row.primary_column as string,
          isConfirmed: false, // Default to false for new relationships
          dbConnectionId: connection.dbConnectionId,
        }));
      });
    } catch (error) {
      console.error('Failed to retrieve table relationships:', error);
      throw new Error(`Failed to retrieve table relationships: ${error.message}`);
    }
  }

  /**
   * Upsert table relationships for a company
   */
  async upsertTableRelationships(data: {
    companyId: string;
    dbConnectionId: string;
    relationships: TableRelationshipDto[];
  }) {
    try {
      // Find the company's database connection
      const connection = await this.getCompanyConnection(data.companyId, data.dbConnectionId);
      if (!connection) {
        throw new Error('Database connection not found');
      }

      // For each relationship, create or update in the database
      const results = await Promise.all(
        data.relationships.map(async (relationship) => {
          return this.prisma.tableRelations.upsert({
            where: {
              unique_table_relation: {
                dbConnectionId: data.dbConnectionId,
                tableName: relationship.tableName,
                columnName: relationship.columnName,
              },
            },
            update: {
              refTable: relationship.refTable,
              refColumn: relationship.refColumn,
              isConfirmed: relationship.isConfirmed || false,
            },
            create: {
              dbConnectionId: data.dbConnectionId,
              tableName: relationship.tableName,
              columnName: relationship.columnName,
              refTable: relationship.refTable,
              refColumn: relationship.refColumn,
              isConfirmed: relationship.isConfirmed || false,
            },
          });
        })
      );

      return {
        success: true,
        count: results.length,
        message: `Successfully saved ${results.length} table relationships`,
      };
    } catch (error) {
      console.error('Failed to save table relationships:', error);
      throw new Error(`Failed to save table relationships: ${error.message}`);
    }
  }

  /**
   * Clean up on application shutdown
   */
  async onModuleDestroy(): Promise<void> {
    await closeAllConnections();
  }
}
