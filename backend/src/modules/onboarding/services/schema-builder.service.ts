import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { JsonValue } from '@prisma/client/runtime/library';
import { PrismaService } from '@supplysense/prisma';
import { SchemaCache } from '@supplysense/prisma-client';
import { withDbConnection } from '@supplysense/utils/server';
import type { PoolClient } from 'pg';
import { ConnectionsService } from '@/modules/connections/connections.service';
import { ColumnExampleAgentService } from '@/modules/mcp-client/services/column-example-agent.service';

interface ColumnInfo {
  type: string;
  description: string;
  example: string;
}

interface TableSchema {
  label: string;
  purpose: string;
  columns: Record<string, ColumnInfo>;
  relationships: Array<{
    column: string;
    refTable: string;
    refColumn: string;
  }>;
  sampleData?: Array<Record<string, string | number | boolean | null>>;
}

interface CompleteSchema {
  tables: Record<string, TableSchema>;
  businessContext?: string;
}

interface TableMetadataRecord {
  tableName: string;
  friendlyLabel: string;
  purpose: string;
}

type TRelationship = {
  tableName: string;
  columnName: string;
  refTable: string;
  refColumn: string;
  description: string;
  isConfirmed: boolean;
  actionVariant: string;
};

type TableRelationRecord = {
  id: string;
  dbConnectionId: string;
  relationships: JsonValue;
};
@Injectable()
export class SchemaBuilderService {
  private readonly logger = new Logger(SchemaBuilderService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConnectionsService)
    private readonly connectionsService: ConnectionsService,
    @Inject(ColumnExampleAgentService)
    private readonly columnExampleAgent: ColumnExampleAgentService
  ) {}

  /**
   * Builds a complete schema for a company's database connection and caches it
   * @param companyId The ID of the company
   * @param dbConnectionId The ID of the database connection
   * @returns The cached schema object
   */
  async buildAndCacheSchema(companyId: string, dbConnectionId: string): Promise<SchemaCache> {
    try {
      this.logger.log(`Building schema for company ${companyId}, connection ${dbConnectionId}`);

      // 1. Load db connection details
      const dbConnection = await this.prisma.dbConnection.findUnique({
        where: { id: dbConnectionId },
        include: {
          TableMetadata: true,
          TableRelations: true,
        },
      });

      if (!dbConnection) {
        throw new NotFoundException(`Database connection not found for company ${companyId}`);
      }

      // Get full connection details with decrypted password
      const connectionDetails = await this.connectionsService.getCompanyConnection(
        companyId,
        dbConnectionId
      );

      // 2. Build the complete schema
      const schema: CompleteSchema = {
        tables: {},
        businessContext: dbConnection.businessContext || '',
      };

      // Process each table that has metadata
      if (dbConnection.TableMetadata && Array.isArray(dbConnection.TableMetadata)) {
        await withDbConnection(connectionDetails, async (client) => {
          for (const tableMetadata of dbConnection.TableMetadata) {
            await this.processTableMetadata({
              client,
              tableMetadata: tableMetadata as TableMetadataRecord,
              tableRelations: (dbConnection.TableRelations ?? []) as TableRelationRecord[],
              schema,
            });
          }
        });
      }

      // 5. Cache in the schema_cache table with 24h TTL
      // We don't actually need to set TTL since we have a cachedAt field
      // We can check if it's older than 24h when retrieving
      // Prisma expects Json type for schema
      const cachedSchema = await this.prisma.schemaCache.upsert({
        where: { dbConnectionId },
        create: {
          schema: JSON.stringify(schema),
          dbConnectionId,
          cachedAt: new Date(),
        },
        update: {
          schema: JSON.stringify(schema),
          cachedAt: new Date(),
        },
      });

      return cachedSchema;
    } catch (error) {
      this.logger.error(`Error building schema: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Gets the cached schema for a company's database connection
   * If the cache is older than 24h or doesn't exist, it rebuilds it
   * @param companyId The ID of the company
   * @param dbConnectionId The ID of the database connection
   * @returns The cached schema
   */
  async getSchema(companyId: string, dbConnectionId: string): Promise<SchemaCache> {
    try {
      // Check if we have a cached schema
      const cachedSchema = await this.prisma.schemaCache.findUnique({
        where: { dbConnectionId },
      });

      // If no cached schema or it's older than 24 hours, rebuild it
      if (!cachedSchema || this.isCacheExpired(cachedSchema.cachedAt)) {
        return this.buildAndCacheSchema(companyId, dbConnectionId);
      }

      return cachedSchema;
    } catch (error) {
      this.logger.error(`Error getting schema: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async processTableMetadata({
    client,
    tableMetadata,
    tableRelations,
    schema,
  }: {
    client: PoolClient;
    tableMetadata: TableMetadataRecord;
    tableRelations: TableRelationRecord[];
    schema: CompleteSchema;
  }): Promise<void> {
    this.logger.debug(`Processing table ${tableMetadata.tableName}`);

    const columnsResult = await client.query(
      `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name=$1
        ORDER BY ordinal_position
      `,
      [tableMetadata.tableName]
    );

    const sampleData = await this.fetchSampleData(client, tableMetadata.tableName);
    const sanitizedSampleData = this.sanitizeSampleData(sampleData);

    const columnInputs = columnsResult.rows.map((row) => ({
      tableName: tableMetadata.tableName,
      columnName: row.column_name,
      dataType: row.data_type,
      sampleData: sanitizedSampleData,
    }));

    const { columnExamples, columnDescriptions } = await this.generateColumnInsights(
      tableMetadata.tableName,
      columnInputs
    );

    const columns: Record<string, ColumnInfo> = {};
    for (const row of columnsResult.rows) {
      const columnName = row.column_name;
      const dataType = row.data_type;

      columns[columnName] = {
        type: this.mapDataTypeToSimpleType(dataType),
        description:
          columnDescriptions[columnName] ??
          this.generateDefaultColumnDescription(columnName, dataType),
        example: columnExamples[columnName],
      };
    }

    const relationships = this.buildRelationships(tableMetadata.tableName, tableRelations);

    schema.tables[tableMetadata.tableName] = {
      label: tableMetadata.friendlyLabel,
      purpose: tableMetadata.purpose,
      columns,
      relationships,
      sampleData: sanitizedSampleData.length > 0 ? sanitizedSampleData : undefined,
    };
  }

  private async fetchSampleData(
    client: PoolClient,
    tableName: string
  ): Promise<Array<Record<string, unknown>>> {
    try {
      const sampleResult = await client.query(`SELECT * FROM "${tableName}" LIMIT 5`);
      return sampleResult.rows;
    } catch (error) {
      this.logger.warn(
        `Could not fetch sample data for table ${tableName}: ${(error as Error).message}`
      );
      return [];
    }
  }

  private async generateColumnInsights(
    tableName: string,
    columnInputs: Array<{
      tableName: string;
      columnName: string;
      dataType: string;
      sampleData: Array<Record<string, string | number | boolean | null>>;
    }>
  ): Promise<{
    columnExamples: Record<string, string>;
    columnDescriptions: Record<string, string>;
  }> {
    try {
      const exampleResults = await this.columnExampleAgent.generateColumnExamples(columnInputs);

      return exampleResults.reduce(
        (acc, result) => {
          acc.columnExamples[result.columnName] = result.exampleValue;
          if (result.description) {
            acc.columnDescriptions[result.columnName] = result.description;
          }
          return acc;
        },
        { columnExamples: {}, columnDescriptions: {} } as {
          columnExamples: Record<string, string>;
          columnDescriptions: Record<string, string>;
        }
      );
    } catch (error) {
      this.logger.warn(
        `Could not generate column examples for table ${tableName}: ${(error as Error).message}`
      );
      return { columnExamples: {}, columnDescriptions: {} };
    }
  }

  private buildRelationships(
    tableName: string,
    tableRelations: TableRelationRecord[]
  ): TableSchema['relationships'] {
    return tableRelations.flatMap((record) => {
      // Parse the relationships JSON if it's a string
      const relationships =
        typeof record.relationships === 'string'
          ? JSON.parse(record.relationships)
          : record.relationships;

      // Ensure relationships is an array
      const relations = Array.isArray(relationships) ? relationships : [];

      return relations
        .filter(
          (relation: TRelationship) =>
            relation.tableName === tableName &&
            (relation.isConfirmed === undefined || relation.isConfirmed)
        )
        .map((relation: TRelationship) => ({
          column: relation.columnName,
          refTable: relation.refTable,
          refColumn: relation.refColumn,
        }));
    });
  }

  private sanitizeSampleData(
    rows: Array<Record<string, unknown>>
  ): Array<Record<string, string | number | boolean | null>> {
    return rows.map((row) => {
      return Object.entries(row).reduce<Record<string, string | number | boolean | null>>(
        (acc, [key, value]) => {
          acc[key] = this.normalizeSampleValue(value);
          return acc;
        },
        {}
      );
    });
  }

  private normalizeSampleValue(value: unknown): string | number | boolean | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    return JSON.stringify(value);
  }

  private generateDefaultColumnDescription(columnName: string, dataType: string): string {
    const friendlyName = columnName
      .replace(/[_-]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();

    return `${friendlyName} (${dataType}) column`;
  }

  /**
   * Determines if a cache timestamp is expired (older than 24 hours)
   * @param cachedAt The timestamp when the cache was last updated
   * @returns True if the cache is expired
   */
  private isCacheExpired(cachedAt: Date): boolean {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    return cachedAt < twentyFourHoursAgo;
  }

  /**
   * Maps database data types to simple, user-friendly types
   * @param dataType The database data type
   * @returns A simplified type string
   */
  private mapDataTypeToSimpleType(dataType: string): string {
    const type = dataType.toLowerCase();

    if (type.includes('int') || type.includes('serial') || type.includes('bigint')) {
      return 'number';
    }
    if (type.includes('varchar') || type.includes('text') || type.includes('char')) {
      return 'string';
    }
    if (type.includes('bool')) {
      return 'boolean';
    }
    if (type.includes('date') || type.includes('time')) {
      return 'date';
    }
    if (
      type.includes('decimal') ||
      type.includes('numeric') ||
      type.includes('float') ||
      type.includes('double')
    ) {
      return 'number';
    }
    if (type.includes('json')) {
      return 'object';
    }

    return 'string'; // Default fallback
  }
}
