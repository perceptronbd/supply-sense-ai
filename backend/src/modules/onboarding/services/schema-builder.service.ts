import { Inject, Injectable, Logger, NotFoundException, forwardRef } from '@nestjs/common';

import { PrismaService } from '@/app/prisma.service';
import { SchemaCache } from '@prisma/client';
import { withDbConnection } from '../helpers/db-connection.helper';
import { OnboardingService } from './onboarding.service';

interface TableSchema {
  label: string;
  purpose: string;
  columns: Record<string, string>;
  relationships: Array<{
    column: string;
    refTable: string;
    refColumn: string;
  }>;
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
    @Inject(forwardRef(() => OnboardingService))
    private readonly onboardingService: OnboardingService
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
      const connectionDetails = await this.onboardingService.getCompanyConnection(
        companyId,
        dbConnectionId
      );

      // 2. Build the complete schema
      const schema: CompleteSchema = {
        tables: {},
        businessContext: dbConnection.businessContext || '',
      };

      // Process each table that has metadata
      if (dbConnection.TableMetadata) {
        const tableMetadata = dbConnection.TableMetadata;

        // 3. Connect to Customer DB and query columns for each table
        await withDbConnection(connectionDetails, async (client) => {
          // For each table, get its columns
          const result = await client.query(
            `
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name=$1
          `,
            [tableMetadata.tableName]
          );

          // Build columns object
          const columns: Record<string, string> = {};
          for (const row of result.rows) {
            columns[row.column_name] = row.data_type;
          }

          // Get relationships for this table
          const relationships = dbConnection.TableRelations.filter(
            (relation) => relation.tableName === tableMetadata.tableName && relation.isConfirmed
          ).map((relation) => ({
            column: relation.columnName,
            refTable: relation.refTable,
            refColumn: relation.refColumn,
          }));

          // Add table to schema
          schema.tables[tableMetadata.tableName] = {
            label: tableMetadata.friendlyLabel,
            purpose: tableMetadata.purpose,
            columns,
            relationships,
          };
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
}
