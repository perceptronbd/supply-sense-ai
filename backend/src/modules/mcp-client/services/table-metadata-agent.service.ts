import { buildMetadataPrompt } from '@/modules/onboarding/helpers/build-metadata-prompt';
import { Agent } from '@mastra/core/agent';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { AI_MODEL_NAME } from '@supplysense/constant';
import type {
  ITableSchemaInput,
  MCPTableMetadataAgentRes,
  TUpdateFrequency,
} from '@supplysense/types';
import { generateFriendlyLabel } from '@supplysense/utils';
import { McpClientService } from './mcp-client.service'; // Keep this import

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

interface TableMetadataInput {
  tableName: string;
  tableSchema: ITableSchemaInput;
  businessContext?: string;
}

/**
 * Specialized service for generating table metadata using MCP tools
 * This service focuses specifically on table analysis and metadata generation
 */
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';

@Injectable()
export class TableMetadataAgentService {
  private readonly logger = new Logger(TableMetadataAgentService.name);
  private metadataAgent: Agent | null = null;
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
        instructions:
          'Analyze table schema and generate comprehensive metadata including friendly labels, purpose, update frequency, and sample business questions.',
        model: openrouter(AI_MODEL_NAME),
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
  private async generateWithRetry(
    messages: any[],
    options: any,
    tableName: string,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<any> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (!this.metadataAgent) {
          throw new Error('Table metadata agent not initialized');
        }

        return await this.metadataAgent.generate(messages, options);
      } catch (error) {
        lastError = error as Error;
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Check if it's a rate limiting error
        if (errorMessage.includes('Too Many Requests') || errorMessage.includes('429')) {
          const delay = baseDelay * 2 ** (attempt - 1); // Exponential backoff
          this.logger.warn(
            `Rate limit hit for table ${tableName}, attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms...`
          );

          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }

        // If it's not a rate limiting error, or we've exhausted retries, throw immediately
        throw error;
      }
    }

    throw lastError!;
  }

  /**
   * Generate table metadata using the specialized agent
   */
  async generateTableMetadata(input: TableMetadataInput): Promise<MCPTableMetadataAgentRes> {
    try {
      await this.initializeMetadataAgent();

      if (!this.metadataAgent) {
        throw new Error('Table metadata agent not initialized');
      }

      const { tableName, tableSchema, businessContext } = input;

      // Prepare the input for the metadata analysis tool
      const toolInput = {
        tableName,
        tableSchema,
        businessContext: businessContext || `Database table analysis for ${tableName}`,
      };

      // Create a focused prompt for table metadata generation
      const prompt = buildMetadataPrompt({
        tableName,
        tableSchema,
        toolInput,
        businessContext,
      });

      this.logger.log(`🔍 Analyzing table metadata for: ${tableName}`);

      // Use the specialized agent to generate metadata with retry logic
      const response = await this.generateWithRetry(
        [
          {
            role: 'user',
            content: prompt,
          },
        ],
        {
          toolChoice: {
            type: 'tool',
            toolName: 'supplySense_analyzeTableMetadataTool',
          },
        },
        tableName
      );

      this.logger.log('✅ Table metadata generated successfully');

      // Parse the response to extract structured metadata
      return this.parseMetadataResponse(response.text, tableName, tableSchema);
    } catch (error) {
      this.logger.error(`❌ Failed to generate metadata for table ${input.tableName}:`, error);

      // Fallback to basic metadata generation
      return this.generateFallbackMetadata(input.tableName, input.tableSchema);
    }
  }

  /**
   * Parse the agent response to extract structured metadata
   */
  private parseMetadataResponse(
    responseText: string,
    tableName: string,
    tableSchema: ITableSchemaInput
  ): MCPTableMetadataAgentRes {
    try {
      // Try to extract JSON from the response
      const jsonRegex = /\{[\s\S]*\}/;
      const jsonMatch = jsonRegex.exec(responseText);

      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);

        // Validate and structure the response
        return {
          tableName: parsedData.tableName || tableName,
          friendlyLabel: parsedData.friendlyLabel || generateFriendlyLabel(tableName),
          purpose: parsedData.purpose || `Data storage for ${tableName}`,
          updateFrequency:
            this.validateUpdateFrequency(parsedData.updateFrequency) ||
            this.inferUpdateFrequency(tableSchema),
          sampleQuestions: Array.isArray(parsedData.sampleQuestions)
            ? parsedData.sampleQuestions.slice(0, 5)
            : this.generateBasicSampleQuestions(tableName),
        };
      }

      // If no JSON found, try to parse text response
      return this.parseTextResponse(responseText, tableName, tableSchema);
    } catch (error) {
      this.logger.warn('Failed to parse metadata response, using fallback:', error);
      return this.generateFallbackMetadata(tableName, tableSchema);
    }
  }

  /**
   * Parse text response when JSON parsing fails
   */
  private parseTextResponse(
    responseText: string,
    tableName: string,
    tableSchema: ITableSchemaInput
  ): MCPTableMetadataAgentRes {
    const friendlyLabel =
      this.extractFromText(responseText, 'friendly.?label') || generateFriendlyLabel(tableName);

    const purpose =
      this.extractFromText(responseText, 'purpose') || this.inferPurpose(tableName, tableSchema);

    const updateFrequency =
      this.extractUpdateFrequency(responseText) || this.inferUpdateFrequency(tableSchema);

    const sampleQuestions =
      this.extractSampleQuestions(responseText) || this.generateBasicSampleQuestions(tableName);

    return {
      tableName,
      friendlyLabel,
      purpose,
      updateFrequency,
      sampleQuestions,
    };
  }

  /**
   * Generate fallback metadata when agent fails
   */
  private generateFallbackMetadata(
    tableName: string,
    tableSchema: ITableSchemaInput
  ): MCPTableMetadataAgentRes {
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
   * Validate update frequency value
   */
  private validateUpdateFrequency(frequency: string): TUpdateFrequency | null {
    const validFrequencies: TUpdateFrequency[] = [
      'real-time',
      'daily',
      'weekly',
      'monthly',
      'rarely',
    ];
    return validFrequencies.includes(frequency as TUpdateFrequency)
      ? (frequency as TUpdateFrequency)
      : null;
  }

  /**
   * Extract information from text using regex
   */
  private extractFromText(text: string, field: string): string | null {
    const regex = new RegExp(`${field}[:\\s]*(.*?)(?:\n|$)`, 'i');
    const match = regex.exec(text);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract update frequency from text
   */
  private extractUpdateFrequency(text: string): TUpdateFrequency | null {
    const frequencies: TUpdateFrequency[] = ['real-time', 'daily', 'weekly', 'monthly', 'rarely'];
    for (const freq of frequencies) {
      if (text.toLowerCase().includes(freq)) {
        return freq;
      }
    }
    return null;
  }

  /**
   * Extract sample questions from text
   */
  private extractSampleQuestions(text: string): string[] {
    const lines = text.split('\n');
    const questions: string[] = [];
    let inQuestionSection = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (/questions?|queries?/i.test(trimmedLine)) {
        inQuestionSection = true;
        continue;
      }

      if (inQuestionSection && trimmedLine) {
        const questionMatch = /^(?:\d+\.|-|\*|•)\s*(.+)/.exec(trimmedLine);
        if (questionMatch) {
          questions.push(questionMatch[1].trim());
        } else if (!trimmedLine.includes(':')) {
          questions.push(trimmedLine);
        } else {
          inQuestionSection = false;
        }
      }
    }

    return questions.length > 0 ? questions.slice(0, 5) : [];
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
