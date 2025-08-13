import { PrismaService } from '@/app/prisma.service';
import { SharedService } from '@/modules/common/services/shared.service';
import { ConnectionsService } from '@/modules/connections/connections.service';
import { TableMetadataAgentService } from '@/modules/mcp-client/services/table-metadata-agent.service';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  IDatabaseClient,
  IDatabaseRow,
  ITableMetadataRecord,
  ITableRelationship,
  ITableSchemaInput,
} from '@supplysense/types';
import { withDbConnection } from 'src/helpers/db-connection.helper';
import { GET_TABLES_QUERY } from '../constant/table-schema';
import type { BatchSaveMetadataDto, CaptureMetadataDto } from '../dto/metadata.dto';
import type { DbCredentials } from '../types/db-connection.type';

@Injectable()
export class MetadataService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TableMetadataAgentService)
    private readonly tableMetadataAgent: TableMetadataAgentService,
    @Inject(ConnectionsService)
    private readonly connectionsService: ConnectionsService,
    @Inject(SharedService)
    private readonly sharedService: SharedService,
    private readonly logger = new Logger(MetadataService.name)
  ) {}

  async captureMetadata(dto: CaptureMetadataDto) {
    const connection = await this.connectionsService.getCompanyConnection(
      dto.companyId,
      dto.dbConnectionId
    );

    if (!connection) {
      throw new Error('Specified database connection not found');
    }

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
  }

  private async captureMetadataForConnection(
    connection: DbCredentials & { dbConnectionId: string; title?: string },
    tables: Array<{ tableName: string }>,
    companyId: string
  ) {
    return withDbConnection(connection, async (client) => {
      // Extract table names from the tables array
      const tableNames = tables.map((table) => table.tableName);

      try {
        // Get schemas for all tables
        const tablesWithSchemas = [];
        for (const tableName of tableNames) {
          try {
            const tableSchema = await this.getTableSchema(client, tableName);
            tablesWithSchemas.push({ tableName, tableSchema });
          } catch (error) {
            this.logger.error(`Error getting schema for table ${tableName}:`, error);
          }
        }

        // Send all tables at once to generateTableMetadata
        const metadataResults = await this.generateTableMetadata(tablesWithSchemas, companyId);

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
    });
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
      // Use the dedicated table metadata agent service to process all tables at once
      const agentResponse = await this.tableMetadataAgent.generateTableMetadata({
        tables: tablesWithSchemas,
        businessContext,
      });

      if (agentResponse.usage) {
        await this.sharedService.tokenPriceCalculate({
          companyId,
          inputTokens: agentResponse.usage.promptTokens,
          outputTokens: agentResponse.usage.completionTokens,
          isDeductCredit: true,
          metadata: {
            question: agentResponse.question,
            answer: JSON.stringify(agentResponse.result),
          },
        });
      }

      return agentResponse.result.map((response) => ({
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
            this.prisma.tableMetadata.create({
              data: {
                ...metadata,
                dbConnection: {
                  connect: { id: data.dbConnectionId },
                },
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
}
