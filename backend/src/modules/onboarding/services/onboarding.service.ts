import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { PrismaService } from '@supplysense/prisma';
import type { IDatabaseClient } from '@supplysense/types';
import { closeAllConnections, withDbConnection } from '@supplysense/utils/server';
import { ConnectionsService } from '../../connections/connections.service';
import { TableDescriptionAgentService } from '../../mcp-client/services/table-description-agent.service';
import type { TableRelationshipDto } from '../dto/table-relationship.dto';
import { SchemaBuilderService } from './schema-builder.service';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(forwardRef(() => SchemaBuilderService))
    private readonly schemaBuilderService: SchemaBuilderService,
    @Inject(ConnectionsService)
    private readonly connectionsService: ConnectionsService,
    @Inject(TableDescriptionAgentService)
    private readonly tableDescriptionAgent: TableDescriptionAgentService
  ) {}

  /*
   * Retrieve the schema of the database tables for a specific company
   * This method connects to the database and retrieves the table names from the public schema.
   */

  async getTables(companyId: string, dbConnectionId?: string) {
    const connections = await this.connectionsService.getDbConnections(companyId);

    if (connections.length === 0) {
      throw new Error('No database connections found for this company');
    }

    // If dbConnectionId is provided, use that specific connection
    if (dbConnectionId) {
      const connection = connections.find((conn) => conn.id === dbConnectionId);
      if (!connection) {
        throw new Error('Specified database connection not found');
      }
      return this.connectionsService.getTablesForConnection(connection);
    }

    // Otherwise, use the first connection by default
    const firstConnection = connections[0];
    return this.connectionsService.getTablesForConnection(firstConnection);
  }

  /**
   * Get table relationships for a company's database connection
   */
  async getTableRelationships(companyId: string, dbConnectionId: string) {
    try {
      // Find the company's database connection
      const connection = await this.connectionsService.getCompanyConnection(
        companyId,
        dbConnectionId
      );
      // Prepare DbCredentials object with decrypted password

      // Query foreign key relationships from the database
      const relationships = await withDbConnection(connection, async (client: IDatabaseClient) => {
        const { rows } = await client.query({
          text: `
            SELECT
              tc.table_name AS foreign_table,
              kcu.column_name AS foreign_column,
              ccu.table_name AS primary_table,
              ccu.column_name AS primary_column,
              c.data_type AS column_data_type,
              c.udt_name AS column_udt_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
            JOIN information_schema.columns c
              ON c.table_name = tc.table_name 
              AND c.column_name = kcu.column_name
              AND c.table_schema = tc.table_schema
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
          description: '', // Will be populated by the agent
        }));
      });

      // Generate descriptions for all relationships at once using the AI agent
      const descriptionInputs = relationships.map((relationship) => ({
        tableName: relationship.tableName,
        columnName: relationship.columnName,
        refTable: relationship.refTable,
        refColumn: relationship.refColumn,
      }));

      try {
        const descriptions = await this.tableDescriptionAgent.generateMultipleDescriptions(
          descriptionInputs,
          companyId
        );

        // Combine relationships with descriptions
        const relationshipsWithDescriptions = relationships.map((relationship, index) => ({
          ...relationship,
          description:
            descriptions[index] ||
            `${relationship.tableName} references ${relationship.refTable} through ${relationship.columnName}`,
        }));

        return relationshipsWithDescriptions;
      } catch (error) {
        this.logger.error('Failed to generate descriptions for relationships:', error);
        // Use fallback descriptions if agent fails
        return relationships.map((relationship) => ({
          ...relationship,
          description: `${relationship.tableName} references ${relationship.refTable} through ${relationship.columnName}`,
        }));
      }
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
      const connection = await this.connectionsService.getCompanyConnection(
        data.companyId,
        data.dbConnectionId
      );
      if (!connection) {
        throw new Error('Database connection not found');
      }

      // For each relationship, create or update in the database
      const results = await this.prisma.$transaction(
        data.relationships.map((relationship) =>
          this.prisma.tableRelations.upsert({
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
          })
        )
      );

      // After relationships are saved successfully, build and cache the schema
      await this.schemaBuilderService.buildAndCacheSchema(data.companyId, data.dbConnectionId);

      return {
        success: true,
        count: results.length,
        message: `Successfully saved ${results.length} table relationships and updated schema cache`,
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
