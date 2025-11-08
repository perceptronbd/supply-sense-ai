import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@supplysense/prisma';
import type { IDatabaseClient } from '@supplysense/types';
import { closeAllConnections, withDbConnection } from '@supplysense/utils/server';
import { ConnectionsService } from '../../connections/connections.service';
import { TableDescriptionAgentService } from '../../mcp-client/services/table-description-agent.service';
import type { CaptureMetadataDto } from '../dto/metadata.dto';
import type { TableRelationshipDto } from '../dto/table-relationship.dto';
import type { UpdateConnectionsDto } from '../dto/update-connections.dto';
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
    const connections = await this.connectionsService.getDbConnectionsByCompanyId(companyId);

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
   * Save selected tables for a company's database connection
   */
  async saveSelectedTables(companyId: string, data: CaptureMetadataDto) {
    // Validate if the database connection exists
    await this.connectionsService.checkExistingDbConnection(data.dbConnectionId);

    // Prepare the tables data with proper formatting
    const tablesData = data.tables.map((table) => ({
      tableName: table.tableName,
      displayName: table.displayName,
    }));

    // Use upsert to either create a new record or update existing one
    return this.prisma.onboardingSelectedTable.upsert({
      where: {
        dbConnectionId_companyId: {
          dbConnectionId: data.dbConnectionId,
          companyId,
        },
      },
      update: {
        tables: tablesData,
      },
      create: {
        dbConnectionId: data.dbConnectionId,
        companyId,
        tables: tablesData,
      },
    });
  }

  /**
   * Get selected tables for a company's database connection
   */
  async getSelectedTables(companyId: string, dbConnectionId: string) {
    const company = await this.prisma.company.findUnique({
      where: {
        id: companyId,
      },
    });

    if (!company) {
      throw new BadRequestException('Company not found');
    }

    await this.connectionsService.checkExistingDbConnection(dbConnectionId);

    const result = await this.prisma.onboardingSelectedTable.findUnique({
      where: {
        dbConnectionId_companyId: {
          dbConnectionId,
          companyId,
        },
      },
      select: {
        tables: true,
      },
    });

    if (!result) {
      throw new BadRequestException('Selected tables not found for this company and connection');
    }

    // Return the tables array or empty array if no record exists
    return result.tables;
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
    userId: string;
    relationships: TableRelationshipDto[];
  }) {
    try {
      // Input validation
      if (!data.userId) {
        throw new BadRequestException('User ID is required');
      }
      if (!data.companyId) {
        throw new BadRequestException('Company ID is required');
      }
      if (!data.dbConnectionId) {
        throw new BadRequestException('Database connection ID is required');
      }
      if (
        !data.relationships ||
        !Array.isArray(data.relationships) ||
        data.relationships.length === 0
      ) {
        throw new BadRequestException('At least one table relationship is required');
      }
      // Find the company's database connection
      const connection = await this.connectionsService.getCompanyConnection(
        data.companyId,
        data.dbConnectionId
      );
      if (!connection) {
        throw new Error('Database connection not found');
      }

      // Find the user associated with the company
      const user = await this.prisma.user.findFirst({
        // Search for the user with the given ID and company ID
        where: {
          id: data.userId,
          companyId: data.companyId,
        },
      });

      // If user is not found, throw an error
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Update the user's isCompleteOnboarding field to true
      try {
        this.logger.debug('Updating user onboarding status:', { userId: data.userId });
        const updatedUser = await this.prisma.user.update({
          where: {
            id: data.userId,
          },
          data: {
            isCompleteOnboarding: true,
          },
          select: {
            id: true,
            isCompleteOnboarding: true,
            email: true,
          },
        });
        this.logger.debug('User onboarding status updated successfully:', updatedUser);
      } catch (updateError) {
        this.logger.error('Failed to update user onboarding status:', {
          error: updateError,
          userId: data.userId,
          timestamp: new Date().toISOString(),
        });
        throw new Error(`Failed to update user onboarding status: ${updateError.message}`);
      }

      // Create or update a single record with all relationships as a JSON array
      const relationshipsData = data.relationships.map((relationship) => ({
        tableName: relationship.tableName,
        columnName: relationship.columnName,
        refTable: relationship.refTable,
        refColumn: relationship.refColumn,
        isConfirmed: relationship.isConfirmed || false,
        actionVariant: relationship.actionVariant,
        description: relationship.description || '',
      }));

      // Upsert the relationships as a single JSON array
      const result = await this.prisma.tableRelations.upsert({
        where: {
          dbConnectionId: data.dbConnectionId,
        },
        update: {
          relationships: relationshipsData,
        },
        create: {
          dbConnectionId: data.dbConnectionId,
          relationships: relationshipsData,
        },
      });

      this.logger.debug('Table relationships saved successfully:', result);

      // After relationships are saved successfully, build and cache the schema
      await this.schemaBuilderService.buildAndCacheSchema(data.companyId, data.dbConnectionId);

      return {
        success: true,
        count: relationshipsData.length,
        message: `Successfully saved ${relationshipsData.length} table relationships and updated schema cache`,
      };
    } catch (error) {
      this.logger.error('Failed to save table relationships:', error);
      throw new Error(`Failed to save table relationships: ${error.message}`);
    }
  }

  async updateBusinessContext(dbConnectionId: string, dto: UpdateConnectionsDto) {
    const dbConnection = await this.connectionsService.getDbConnection(dbConnectionId);
    if (!dbConnection) {
      throw new Error('Database connection not found');
    }

    await this.prisma.dbConnection.update({
      where: {
        id: dbConnectionId,
      },
      data: {
        businessContext: dto.businessContext,
        title: dto.title,
      },
    });

    return {
      success: true,
      message: 'Database connection updated successfully',
    };
  }

  /**
   * Clean up on application shutdown
   */
  async onModuleDestroy(): Promise<void> {
    await closeAllConnections();
  }
}
