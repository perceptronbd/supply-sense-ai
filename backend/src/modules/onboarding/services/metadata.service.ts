import { PrismaService } from '@/app/prisma.service';
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

    const generatedMetadata = await this.captureMetadataForConnection(connection, dto.tables);

    return {
      success: true,
      message: 'Metadata captured and saved successfully',
      metadata: generatedMetadata,
    };
  }

  private async captureMetadataForConnection(
    connection: DbCredentials & { dbConnectionId: string; title?: string },
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
          const metadata = await this.generateTableMetadata(tableName, tableSchema);
          metadataResults.push(metadata);
        } catch (error) {
          console.error(`Error processing table ${tableName}:`, error);
          // Continue with other tables even if one fails
        }
      }

      return {
        dbConnectionId: connection.dbConnectionId,
        connectionTitle: connection.title || 'Default Connection',
        generatedMetadata: metadataResults,
      };
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
   * Generate metadata for a table using the specialized table metadata agent
   */
  async generateTableMetadata(
    tableName: string,
    tableSchema: ITableSchemaInput,
    businessContext?: string
  ) {
    try {
      // Use the dedicated table metadata agent service
      const agentResponse = await this.tableMetadataAgent.generateTableMetadata({
        tableName,
        tableSchema,
        businessContext,
      });

      return {
        tableName,
        friendlyLabel: agentResponse.friendlyLabel,
        purpose: agentResponse.purpose,
        updateFrequency: agentResponse.updateFrequency,
        sampleQuestions: agentResponse.sampleQuestions,
      };
    } catch (error) {
      this.logger.error(`Error generating metadata for table ${tableName}:`, error);
      throw new Error(`Failed to generate metadata for table ${tableName}`);
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

      // Use transaction to ensure all metadata records are saved together
      const savedRecords = await this.prisma.$transaction(
        data.tableMetadata.map((metadata) =>
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

      return savedRecords;
    } catch (error) {
      console.error('Error saving metadata for table ', error);
      throw new Error('Failed to save metadata for table');
    }
  }
}
