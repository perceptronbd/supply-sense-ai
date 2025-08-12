import { Agent } from '@mastra/core/agent';
import type {
  IMcpTableMetadata,
  ITableSchemaInput,
  MCPTableMetadataAgentRes,
  TUpdateFrequency,
} from '@supplysense/types';
import { GetOpenRouter, generateFriendlyLabel } from '@supplysense/utils';
import { McpClientService } from './mcp-client.service'; // Keep this import

interface TableMetadataInput {
  tables: Array<{ tableName: string; tableSchema: ITableSchemaInput }>;
  businessContext?: string;
}

import { buildMultipleTablesMetadataPrompt } from '@/modules/onboarding/helpers/build-metadata-prompt';
/**
 * Specialized service for generating table metadata using MCP tools
 * This service focuses specifically on table analysis and metadata generation
 */
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';

@Injectable()
export class TableMetadataAgentService {
  private readonly logger = new Logger(TableMetadataAgentService.name);
  private metadataAgent: Agent | null = null;
  private readonly openrouter = new GetOpenRouter();
  constructor(
    @Inject(forwardRef(() => McpClientService))
    private readonly mcpClientService: McpClientService
  ) {}

  /**
   * Initialize the table metadata agent with specific tools for table analysis
   */
  private async initializeMetadataAgent(): Promise<void> {
    if (this.metadataAgent) {
      return; // Already initialized
    }

    try {
      const mcpClient = this.mcpClientService.getMcpClient();
      if (!mcpClient || !this.mcpClientService.isClientConnected()) {
        throw new Error('MCP client not available or not connected');
      }

      // Get all available tools from MCP server
      const tools = await mcpClient.getTools();

      this.metadataAgent = new Agent({
        name: 'TableMetadataAgent',
        description:
          'AI agent specialized in analyzing database table schemas and generating metadata',
        instructions: [
          'You are an expert data analyst. Your task is to analyze the following database tables and generate structured metadata for each one.',
          '',
          'CRITICAL INSTRUCTIONS FOR UNIQUE RESPONSES:',
          '1. Each table MUST have a completely different and unique response',
          '2. Analyze the SPECIFIC column names, data types, and relationships for each table',
          '3. DO NOT use generic templates or similar patterns across tables',
          "4. The friendlyLabel should reflect the table's actual purpose based on its columns",
          '5. The purpose should be specific to what THIS table does based on its schema structure',
          '6. Sample questions MUST reference actual column names from each specific table',
          '7. Consider foreign key relationships and primary keys when generating purpose and questions',
          '8. Each table should have completely different sample questions that cannot be applied to other tables',
          '9. Avoid generic phrases like "manage data" or "store information" - be specific about WHAT data and WHY',
          '',
        ].join('\n'),
        model: this.openrouter.getModel(),
        tools,
      });

      this.logger.log('✅ Table metadata agent initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize table metadata agent:', error);
      throw error;
    }
  }

  /**
   * Generate with retry logic for rate limiting
   */
  private isRateLimitError(errorMessage: string): boolean {
    return errorMessage.includes('Too Many Requests') || errorMessage.includes('429');
  }

  private async delayRetry(delay: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  private async generateWithRetry(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    messages: any[],
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    options: any,
    tableName: string,
    maxRetries = 5,
    baseDelay = 2000
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  ): Promise<any> {
    let lastError: Error = new Error('No retry attempts made');
    if (maxRetries <= 0) {
      throw new Error('maxRetries must be greater than 0');
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (!this.metadataAgent) {
          throw new Error('Table metadata agent not initialized');
        }

        return await this.metadataAgent.generate(messages, options);
      } catch (error) {
        lastError = error as Error;
        if (this.shouldRetryOnRateLimit(error, tableName, attempt, maxRetries, baseDelay)) {
          continue;
        }
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Handles rate limit retry logic for generateWithRetry
   */
  private shouldRetryOnRateLimit(
    error: unknown,
    tableName: string,
    attempt: number,
    maxRetries: number,
    baseDelay: number
  ): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error as string);
    if (this.isRateLimitError(errorMessage)) {
      const delay = baseDelay * 2 ** (attempt - 1); // Exponential backoff
      this.logger.warn(
        `Rate limit hit for table ${tableName}, attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms...`
      );

      if (attempt < maxRetries) {
        this.delayRetry(delay);
        return true;
      }
    }
    return false;
  }

  /**
   * Generate table metadata using the specialized agent for multiple tables
   */
  async generateTableMetadata(input: TableMetadataInput): Promise<MCPTableMetadataAgentRes> {
    try {
      await this.initializeMetadataAgent();

      if (!this.metadataAgent) {
        throw new Error('Table metadata agent not initialized');
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
      // Use the specialized agent to generate metadata for all tables at once
      const response = await this.generateWithRetry(
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
          toolChoice: {
            type: 'tool',
            toolName: 'supplySense_analyzeTableMetadataTool',
          },
        },
        `${tables.length} tables`
      );

      this.logger.log('✅ Table metadata generated successfully for all tables', {
        usage: response.usage,
      });

      this.logger.debug('Response text:', response.text);
      // Parse the response to extract structured metadata for all tables
      const parsedResults = this.parseMultipleTablesResponse(response.text, tables);
      results.push(...parsedResults);

      return { result: results, usage: response.usage, question: systemPrompt };
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
