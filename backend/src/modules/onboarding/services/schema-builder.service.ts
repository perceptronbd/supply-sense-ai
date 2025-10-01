import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { ConnectionsService } from '@/modules/connections/connections.service';
import { ColumnExampleAgentService } from '@/modules/mcp-client/services/column-example-agent.service';
import { PrismaService } from '@supplysense/prisma';
import { SchemaCache } from '@supplysense/prisma-client';
import { withDbConnection } from '@supplysense/utils/server';

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
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  sampleData?: Array<Record<string, any>>;
}

interface CompleteSchema {
  tables: Record<string, TableSchema>;
  businessContext?: string;
}

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
        // 3. Connect to Customer DB and query columns for each table
        // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
        await withDbConnection(connectionDetails, async (client) => {
          for (const tableMetadata of dbConnection.TableMetadata) {
            this.logger.debug(`Processing table ${tableMetadata.tableName}`);

            // For each table, get its columns
            const columnsResult = await client.query(
              `
              SELECT column_name, data_type
              FROM information_schema.columns
              WHERE table_name=$1
              ORDER BY ordinal_position
            `,
              [tableMetadata.tableName]
            );

            // Build columns object with enhanced structure
            const columns: Record<string, ColumnInfo> = {};

            // Get 5 sample rows from the table
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            let sampleData: Array<Record<string, any>> = [];
            try {
              const sampleResult = await client.query(
                `SELECT * FROM "${tableMetadata.tableName}" LIMIT 5`
              );

              sampleData = sampleResult.rows;
            } catch (error) {
              this.logger.warn(
                `Could not fetch sample data for table ${tableMetadata.tableName}: ${error.message}`
              );
            }

            // Prepare column data for example generation with sample data
            const columnInputs = columnsResult.rows.map((row) => ({
              tableName: tableMetadata.tableName,
              columnName: row.column_name,
              dataType: row.data_type,
              sampleData: sampleData, // Pass the actual sample data
            }));

            // Generate column examples using the agent
            let columnExamples: Record<string, string> = {};
            let columnDescriptions: Record<string, string> = {};

            try {
              const exampleResults =
                await this.columnExampleAgent.generateColumnExamples(columnInputs);

              columnExamples = exampleResults.reduce(
                (acc, result) => {
                  acc[result.columnName] = result.exampleValue;
                  return acc;
                },
                {} as Record<string, string>
              );

              // Extract descriptions from the agent results if available
              columnDescriptions = exampleResults.reduce(
                (acc, result) => {
                  // Use the description from agent if available, otherwise generate a basic one
                  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                  acc[result.columnName] = (result as any).description;
                  return acc;
                },
                {} as Record<string, string>
              );
            } catch (error) {
              this.logger.warn(
                `Could not generate column examples for table ${tableMetadata.tableName}: ${error.message}`
              );
            }

            // Build the enhanced columns structure
            for (const row of columnsResult.rows) {
              const columnName = row.column_name;
              const dataType = row.data_type;

              columns[columnName] = {
                type: this.mapDataTypeToSimpleType(dataType),
                description: columnDescriptions[columnName],
                example: columnExamples[columnName],
              };
            }

            // Get relationships for this table
            const relationships = dbConnection.TableRelations
              ? dbConnection.TableRelations.filter(
                  (relation) =>
                    relation.tableName === tableMetadata.tableName && relation.isConfirmed
                ).map((relation) => ({
                  column: relation.columnName,
                  refTable: relation.refTable,
                  refColumn: relation.refColumn,
                }))
              : [];

            // Add table to schema
            schema.tables[tableMetadata.tableName] = {
              label: tableMetadata.friendlyLabel,
              purpose: tableMetadata.purpose,
              columns,
              relationships,
            };
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
