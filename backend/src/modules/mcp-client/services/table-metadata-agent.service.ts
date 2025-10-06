import type {
  IMcpTableMetadata,
  ITableSchemaInput,
  MCPTableMetadataAgentRes,
  TUpdateFrequency,
} from '@supplysense/types';
import { generateFriendlyLabel } from '@supplysense/utils';
import { McpClientService } from './mcp-client.service'; // Keep this import

interface TableMetadataInput {
  tables: Array<{ tableName: string; tableSchema: ITableSchemaInput }>;
  businessContext?: string;
}

import { buildMultipleTablesMetadataPrompt } from '@/modules/onboarding/helpers/build-metadata-prompt';
import { RuntimeContext } from '@mastra/core/runtime-context';
/**
 * Specialized service for generating table metadata using MCP tools
 * This service focuses specifically on table analysis and metadata generation
 */
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { withRetry } from '@supplysense/utils/server';

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
  async generateTableMetadata(input: TableMetadataInput): Promise<MCPTableMetadataAgentRes> {
    try {
      const mcpClient = await this.mcpClientService.initializeMcpClient();
      if (!mcpClient) {
        throw new Error('Chat agent not initialized');
      }

      const { tables } = input;

      // Process all tables at once to avoid rate limiting
      const results: IMcpTableMetadata[] = [];

      // Create a focused prompt for multiple table metadata generation
      const { systemPrompt } = buildMultipleTablesMetadataPrompt();

      this.logger.log(`🔍 Analyzing table metadata for ${tables.length} tables`);

      const inputData = {
        tables: tables.map(({ tableName, tableSchema }) => ({
          tableName,
          tableSchema,
        })),
      };

      const agent = await mcpClient.getAgent('tableMetadataAgent');

      if (!agent) {
        throw new Error('Table metadata agent not initialized');
      }

      const runtimeContext = new RuntimeContext<TableMetadataInput>();

      runtimeContext.set('tables', tables);
      runtimeContext.set('businessContext', input.businessContext);

      const tools = await this.mcpClientService.getTools();
      this.logger.debug('Tools:', tools);

      // Use the specialized agent to generate metadata for all tables at once with retry logic
      this.logger.debug('Starting table metadata generation with retry logic...');
      const response = await withRetry(
        async () => {
          this.logger.debug('Attempting to generate table metadata...');
          return await agent.generate(
            [
              {
                role: 'system',
                content: systemPrompt,
              },
              {
                role: 'user',
                content: JSON.stringify(inputData, null, 2),
              },
            ],
            {
              runtimeContext,
            }
          );
        },
        3, // maxRetries
        5000 // 5 second delay, longer for MCP timeout
      );

      this.logger.log('✅ Table metadata generated successfully for all tables', {
        usage: response.usage,
      });

      this.logger.debug('Response text:', response.text);
      // Parse the response to extract structured metadata for all tables
      const parsedResults = this.parseMultipleTablesResponse(response.text, tables);
      results.push(...parsedResults);

      return {
        result: results,
        usage: response.usage as MCPTableMetadataAgentRes['usage'],
        question: systemPrompt,
      };
    } catch (error) {
      this.logger.error('❌ Failed to generate metadata for tables:', error);
      const fallbackResults = input.tables.map(({ tableName, tableSchema }) =>
        this.generateFallbackMetadata(tableName, tableSchema)
      );
      // Fallback to basic metadata generation for all tables
      return { result: fallbackResults };
    }
  }

  /**
   * Parse the agent response to extract structured metadata for multiple tables
   */
  private parseMultipleTablesResponse(
    responseText: string,
    table: {
      tableName: string;
      tableSchema: ITableSchemaInput;
    }[]
  ): IMcpTableMetadata[] {
    try {
      // Remove Markdown code block markers if present
      const cleaned = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(cleaned);
    } catch (error) {
      this.logger.error('❌ Failed to parse multiple tables response:', error);
      // Fallback to basic metadata generation if parsing fails
      return table.map(({ tableName, tableSchema }) =>
        this.generateFallbackMetadata(tableName, tableSchema)
      );
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
