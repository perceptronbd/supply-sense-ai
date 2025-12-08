import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@supplysense/prisma';
import type {
  IDatabaseClient,
  IDatabaseRow,
  ITableMetadataRecord,
  ITableRelationship,
  ITableSchemaInput,
} from '@supplysense/types';
import { withDbConnection } from '@supplysense/utils/server';
import { TokenAndCredit } from '@/modules/common/services/tokenAndCredit.service';
import { ConnectionsService } from '@/modules/connections/connections.service';
import { TableMetadataAgentService } from '@/modules/mcp-client/services/table-metadata-agent.service';
import { GET_TABLES_QUERY } from '../constant/table-schema';
import type { BatchSaveMetadataDto, CaptureMetadataDto } from '../dto/metadata.dto';
import type { DbCredentials } from '../types/db-connection.type';

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TableMetadataAgentService)
    private readonly tableMetadataAgent: TableMetadataAgentService,
    @Inject(ConnectionsService)
    private readonly connectionsService: ConnectionsService,
    @Inject(TokenAndCredit)
    private readonly tokenAndCredit: TokenAndCredit
  ) {}

  async captureMetadata(dto: CaptureMetadataDto) {
    const connection = await this.connectionsService.getCompanyConnection(
      dto.companyId,
      dto.dbConnectionId
    );

    if (!connection) {
      throw new Error('Specified database connection not found');
    }
    try {
      const generatedMetadata = await this.captureMetadataForConnection(
        connection,
        dto.tables,
        dto.companyId
      );

      return {
        success: true,
        message: 'Metadata captured and saved successfully',
        metadata: generatedMetadata,
      };
    } catch (error) {
      this.logger.error('Error capturing metadata:', error);

      await this.cleanupOnError(dto.companyId, dto.dbConnectionId);
      throw error;
    }
  }

  private async captureMetadataForConnection(
    connection: DbCredentials & {
      dbConnectionId: string;
      title?: string;
      businessContext?: string;
    },
    tables: Array<{ tableName: string }>,
    companyId: string
  ) {
    // Extract table names from the tables array
    const tableNames = tables.map((table) => table.tableName);

    try {
      // Get schemas for all tables - process in parallel batches to improve performance
      // This prevents connection timeout issues when processing many tables
      const tablesWithSchemas = [];
      const BATCH_SIZE = 5; // Process 5 tables concurrently

      for (let i = 0; i < tableNames.length; i += BATCH_SIZE) {
        const batch = tableNames.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(
          batch.map(async (tableName) => {
            try {
              // Use a separate connection for each table to avoid timeout issues
              const tableSchema = await withDbConnection(connection, async (client) => {
                return await this.getTableSchema(client, tableName);
              });
              return { tableName, tableSchema };
            } catch (error) {
              this.logger.error(`Error getting schema for table ${tableName}:`, error);
              throw error;
            }
          })
        );

        // Collect successful results
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            tablesWithSchemas.push(result.value);
          }
        }
      }

      // Send all tables at once to generateTableMetadata
      const metadataResults = await this.generateTableMetadata(
        tablesWithSchemas,
        companyId,
        connection.businessContext
      );

      return {
        dbConnectionId: connection.dbConnectionId,
        connectionTitle: connection.title || 'Default Connection',
        generatedMetadata: metadataResults,
      };
    } catch (error) {
      this.logger.error('Error processing tables:', error);
      return {
        dbConnectionId: connection.dbConnectionId,
        connectionTitle: connection.title || 'Default Connection',
        generatedMetadata: [] as ITableMetadataRecord[],
        failedTables: tableNames.map((tableName) => ({ tableName, error: error.message })),
      };
    }
  }

  private async getTableSchema(
    client: IDatabaseClient,
    tableName: string
  ): Promise<ITableSchemaInput> {
    // Get column information
    const columnQuery = {
      text: GET_TABLES_QUERY,
      values: [tableName],
    };

    const columnResult = await client.query(columnQuery);

    // Transform the result to match our interface
    const columns = columnResult.rows.map((row: IDatabaseRow) => ({
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
      .filter((row: IDatabaseRow) => row.is_foreign_key)
      .map((row: IDatabaseRow) => {
        // Check if THIS foreign key column has a unique constraint
        const isOneToOne = Boolean(row.fk_is_unique);
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

  /**
   * Generate metadata for multiple tables using the specialized table metadata agent
   */
  async generateTableMetadata(
    tablesWithSchemas: Array<{ tableName: string; tableSchema: ITableSchemaInput }>,
    companyId: string,
    businessContext?: string
  ) {
    try {
      const hasAvailableCredit = await this.tokenAndCredit.isAvailableCredit(companyId);
      if (!hasAvailableCredit) {
        this.logger.error('Insufficient credit for generating descriptions');
        throw new BadRequestException('Insufficient credit');
      }
      this.logger.log('Generating metadata for tables', {
        tablesWithSchemas,
        companyId,
        businessContext,
      });
      // Use the dedicated table metadata agent service to process all tables at once
      const agentResponse = await this.tableMetadataAgent.generateTableMetadata({
        tables: tablesWithSchemas,
        businessContext,
      });

      return agentResponse.map((response) => ({
        tableName: response.tableName,
        friendlyLabel: response.friendlyLabel,
        purpose: response.purpose,
        updateFrequency: response.updateFrequency,
        sampleQuestions: response.sampleQuestions,
      }));
    } catch (error) {
      this.logger.error('Error generating metadata for tables:', error);
      throw new Error('Failed to generate metadata for tables');
    }
  }

  /**
   * Save generated metadata to the database
   */
  async saveTableMetadata(
    companyId: string,
    data: BatchSaveMetadataDto
  ): Promise<ITableMetadataRecord[]> {
    try {
      const isValidConnectionId = await this.prisma.dbConnection.findUnique({
        where: { id: data.dbConnectionId, companyId },
      });

      if (!isValidConnectionId) {
        throw new Error('Invalid database connection');
      }

      // Validate metadata before saving
      const validatedMetadata = data.tableMetadata.filter((metadata) => {
        return (
          metadata.tableName &&
          metadata.friendlyLabel &&
          metadata.purpose &&
          metadata.updateFrequency &&
          Array.isArray(metadata.sampleQuestions)
        );
      });

      if (validatedMetadata.length !== data.tableMetadata.length) {
        this.logger.warn(
          `Filtered out ${
            data.tableMetadata.length - validatedMetadata.length
          } invalid metadata entries`
        );
      }

      // Process in batches to avoid transaction size limits
      const BATCH_SIZE = 50;
      const savedRecords = [];

      for (let i = 0; i < validatedMetadata.length; i += BATCH_SIZE) {
        const batch = validatedMetadata.slice(i, i + BATCH_SIZE);
        const batchResults = await this.prisma.$transaction(
          batch.map((metadata) =>
            this.prisma.tableMetadata.upsert({
              where: {
                unique_table_metadata: {
                  dbConnectionId: data.dbConnectionId,
                  tableName: metadata.tableName,
                },
              },
              create: {
                ...metadata,
                dbConnection: {
                  connect: { id: data.dbConnectionId },
                },
              },
              update: {
                ...metadata,
              },
            })
          )
        );
        savedRecords.push(...batchResults);
      }

      return savedRecords;
    } catch (error) {
      this.logger.error('Error saving table metadata:', error);
      throw new Error(`Failed to save metadata: ${error.message || 'Unknown error'}`);
    }
  }
  /**
   * Cleanup method to delete company and database connection on error
   * @param companyId - The ID of the company to delete
   * @param dbConnectionId - The ID of the database connection to delete
   */
  async cleanupOnError(companyId: string, dbConnectionId: string): Promise<void> {
    try {
      this.logger.log(
        `Starting cleanup for failed operation. Company ID: ${companyId}, DB Connection ID: ${dbConnectionId}`
      );

      // Delete the database connection if it exists
      await this.prisma.dbConnection.deleteMany({
        where: {
          id: dbConnectionId,
          companyId: companyId,
        },
      });
      this.logger.log(`Deleted database connection: ${dbConnectionId}`);
    } catch (cleanupError) {
      this.logger.error('Error during cleanup after metadata generation failure:', cleanupError);
      // Re-throw with additional context
      throw new Error(`Failed to clean up resources after error: ${cleanupError.message}`);
    }
  }
}
