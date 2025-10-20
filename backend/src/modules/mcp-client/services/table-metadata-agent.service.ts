import type { IMcpTableMetadata, ITableSchemaInput, TUpdateFrequency } from '@supplysense/types';
import { generateFriendlyLabel } from '@supplysense/utils';
import { McpClientService } from './mcp-client.service'; // Keep this import

interface TableMetadataInput {
  tables: Array<{ tableName: string; tableSchema: ITableSchemaInput }>;
  businessContext?: string;
}

/**
 * Specialized service for generating table metadata using MCP tools
 * This service focuses specifically on table analysis and metadata generation
 */
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TableMetadataAgentService {
  private readonly logger = new Logger(TableMetadataAgentService.name);
  constructor(
    @Inject(forwardRef(() => McpClientService))
    private readonly mcpClientService: McpClientService
  ) {}

  /**
   * Generate table metadata using the specialized agent for multiple tables
   */
  async generateTableMetadata(input: TableMetadataInput): Promise<IMcpTableMetadata[]> {
    try {
      const mcpClient = await this.mcpClientService.initializeMcpClient();
      if (!mcpClient) {
        throw new Error('Chat agent not initialized');
      }

      const workflow = mcpClient.getWorkflow('tableMetadataWorkflow');

      const run = await workflow.createRunAsync();

      this.logger.log('starting workflow to generate metadata for tables', {
        runId: run.runId,
        inputData: input,
      });

      // Start the workflow
      const result = await workflow.startAsync({
        runId: run.runId,
        inputData: input,
      });

      this.logger.log('✅ Table metadata generated successfully for all tables', {
        result,
      });

      const resultData = result as { result: IMcpTableMetadata[] };

      return resultData.result;
    } catch (error) {
      this.logger.error('❌ Failed to generate metadata for tables:', error);
      const fallbackResults = input.tables.map(({ tableName, tableSchema }) =>
        this.generateFallbackMetadata(tableName, tableSchema)
      );
      // Fallback to basic metadata generation for all tables
      return fallbackResults;
    }
  }

  /**
   * Generate fallback metadata when agent fails
   */
  private generateFallbackMetadata(
    tableName: string,
    tableSchema: ITableSchemaInput
  ): IMcpTableMetadata {
    return {
      tableName,
      friendlyLabel: generateFriendlyLabel(tableName),
      purpose: this.inferPurpose(tableName, tableSchema),
      updateFrequency: this.inferUpdateFrequency(tableSchema),
      sampleQuestions: this.generateBasicSampleQuestions(tableName),
    };
  }

  /**
   * Infer table purpose from schema
   */
  private inferPurpose(tableName: string, tableSchema: ITableSchemaInput): string {
    const columns = tableSchema.columns || [];
    const hasTimestamps = columns.some(
      (col) => col.columnName.includes('created_at') || col.columnName.includes('updated_at')
    );
    const hasStatus = columns.some(
      (col) => col.columnName.includes('status') || col.columnName.includes('state')
    );

    if (hasTimestamps && hasStatus) {
      return `Transactional table for managing ${tableName.replace(
        /_/g,
        ' '
      )} with status tracking`;
    }
    if (hasTimestamps) {
      return `Data table for storing ${tableName.replace(/_/g, ' ')} information`;
    }
    return `Reference table for ${tableName.replace(/_/g, ' ')} data`;
  }

  /**
   * Infer update frequency from schema
   */
  private inferUpdateFrequency(tableSchema: ITableSchemaInput): TUpdateFrequency {
    const columns = tableSchema.columns || [];
    const hasStatus = columns.some(
      (col) => col.columnName.includes('status') || col.columnName.includes('state')
    );
    const hasTimestamps = columns.some((col) => col.columnName.includes('updated_at'));

    if (hasStatus && hasTimestamps) return 'real-time';
    if (hasTimestamps) return 'daily';
    return 'rarely';
  }

  /**
   * Generate basic sample questions as fallback
   */
  private generateBasicSampleQuestions(tableName: string): string[] {
    const friendlyName = generateFriendlyLabel(tableName);
    return [
      `What is the total count of records in ${friendlyName}?`,
      `What are the most recent entries in ${friendlyName}?`,
      `How many ${friendlyName} records were created this month?`,
      `What is the distribution of ${friendlyName} by status?`,
      `Show me the top 10 ${friendlyName} records by value`,
    ];
  }
}
