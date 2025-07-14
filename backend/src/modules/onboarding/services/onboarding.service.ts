import { PrismaService } from '@/app/prisma.service';
import { Inject, Injectable } from '@nestjs/common';
import type { ITableRelationship, ITableSchemaInput } from '@supplysense/types';
import { type CaptureMetadataDto, SaveDbConnectionDto } from '../dto/db-connect.dto';
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
import { MetadataService } from './metadata.service';

interface DatabaseClient {
  query(text: string): Promise<{ rows: DatabaseRow[] }>;
  query(config: {
    text: string;
    values: unknown[];
  }): Promise<{ rows: DatabaseRow[] }>;
}

interface DatabaseRow {
  [key: string]: unknown;
}

@Injectable()
export class OnboardingService {
  private readonly encryptionKey: string;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MetadataService) private readonly metadataService: MetadataService
  ) {
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

  async captureMetadata(dto: CaptureMetadataDto) {
    const connections = await this.getDbConnections(dto.companyId);

    if (connections.length === 0) {
      throw new Error('No database connections found for this company');
    }

    // If dbConnectionId is provided, use that specific connection
    if (!dto.dbConnectionId) {
      throw new Error('No dbConnectionId provided');
    }

    const connection = connections.find((conn) => conn.id === dto.dbConnectionId);
    if (!connection) {
      throw new Error('Specified database connection not found');
    }

    const generatedMetadata = await this.captureMetadataForConnection(connection, dto.tables);

    // Save the generated metadata to the database
    // const savedMetadata = await this.saveTableMetadata(generatedMetadata);

    return {
      success: true,
      message: 'Metadata captured and saved successfully',
      metadata: generatedMetadata,
    };
  }

  private async captureMetadataForConnection(
    connection: DbCredentials & { id: string; title?: string },
    tables: Array<{ tableName: string }>
  ) {
    return withDbConnection(connection, async (client) => {
      // Extract table names from the tables array
      const tableNames = tables.map((table) => table.tableName);

      const metadataResults = [];

      for (const tableName of tableNames) {
        try {
          // Get detailed table schema
          const tableSchema = await this.getTableSchema(client, tableName);
          //Call MCP agent to generate metadata
          const metadata = await this.generateTableMetadataWithAgent(
            tableName,
            tableSchema,
            connection.id
          );
          metadataResults.push(metadata);
        } catch (error) {
          console.error(`Error processing table ${tableName}:`, error);
          // Continue with other tables even if one fails
        }
      }

      return {
        dbConnectionId: connection.id,
        connectionTitle: connection.title || 'Default Connection',
        generatedMetadata: metadataResults,
      };
    });
  }

  private async getTableSchema(
    client: DatabaseClient,
    tableName: string
  ): Promise<ITableSchemaInput> {
    // Get column information
    const columnQuery = {
      text: `
        SELECT 
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          c.character_maximum_length,
          c.numeric_precision,
          c.numeric_scale,
          CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
          CASE WHEN fk.ku_column_name IS NOT NULL THEN true ELSE false END as is_foreign_key,
          fk.foreign_table_name,
          fk.foreign_column_name,
          col_description(pgc.oid, c.ordinal_position) as column_comment
        FROM information_schema.columns c
        LEFT JOIN (
          SELECT ku.table_name, ku.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
          WHERE tc.constraint_type = 'PRIMARY KEY'
        ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
        LEFT JOIN (
          SELECT 
            ku.table_name, 
            ku.column_name AS ku_column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            tc.constraint_type,
            (SELECT COUNT(*) 
             FROM information_schema.key_column_usage kcu 
             WHERE kcu.constraint_name = tc.constraint_name) as key_count,
            (SELECT COUNT(*) 
             FROM information_schema.key_column_usage kcu 
             WHERE kcu.table_name = ccu.table_name 
             AND kcu.constraint_name IN (
               SELECT constraint_name 
               FROM information_schema.table_constraints 
               WHERE table_name = ccu.table_name 
               AND constraint_type = 'UNIQUE'
             )) as unique_keys_count
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
          JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
        ) fk ON c.table_name = fk.table_name AND c.column_name = fk.ku_column_name
        LEFT JOIN pg_class pgc ON pgc.relname = c.table_name
        WHERE c.table_name = $1 AND c.table_schema = 'public'
        ORDER BY c.ordinal_position
      `,
      values: [tableName],
    };

    const columnResult = await client.query(columnQuery);

    // // Transform the result to match our interface
    const columns = columnResult.rows.map((row: DatabaseRow) => ({
      columnName: String(row.column_name),
      dataType: String(row.data_type),
      isNullable: row.is_nullable === 'YES',
      isPrimaryKey: Boolean(row.is_primary_key),
      isForeignKey: Boolean(row.is_foreign_key),
      referencedTable: row.foreign_table_name ? String(row.foreign_table_name) : undefined,
      referencedColumn: row.foreign_column_name ? String(row.foreign_column_name) : undefined,
      columnComment: row.column_comment ? String(row.column_comment) : undefined,
    }));

    // Get relationships (simplified for now)
    const relationships = columnResult.rows
      .filter((row: DatabaseRow) => row.is_foreign_key)
      .map((row: DatabaseRow) => {
        // If the foreign key references a unique constraint, it's one-to-one, otherwise many-to-one
        const isOneToOne = Number(row.unique_keys_count) > 0;
        const type = isOneToOne ? 'one-to-one' : 'many-to-one';
        return {
          type: type as ITableRelationship['type'],
          targetTable: String(row.foreign_table_name),
          foreignKey: String(row.column_name),
          description: `Foreign key relationship to ${String(row.foreign_table_name)}`,
        };
      });

    return {
      columns,
      relationships,
    };
  }

  private async generateTableMetadataWithAgent(
    tableName: string,
    tableSchema: ITableSchemaInput,
    dbConnectionId: string
  ) {
    // Use the MetadataService to generate metadata with MCP agent
    const metadata = await this.metadataService.generateTableMetadata(
      tableName,
      tableSchema,
      dbConnectionId
    );
    // Save the generated metadata to the database
    // await this.metadataService.saveTableMetadata(metadata);

    return metadata;
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
