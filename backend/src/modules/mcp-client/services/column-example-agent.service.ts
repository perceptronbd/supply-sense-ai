import type { MastraClient } from '@mastra/client-js';
import { McpClientService } from '@modules/mcp-client/services/mcp-client.service';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { createRuntimeContext } from '@supplysense/utils/server';

type Agent = Awaited<ReturnType<MastraClient['getAgent']>>;

interface ColumnExampleInput {
  tableName: string;
  columnName: string;
  dataType: string;
  sampleData?: Array<Record<string, string | number | boolean | null>>;
  isEnum?: boolean;
  enumValues?: string[];
}

interface ColumnExampleResult {
  columnName: string;
  exampleValue: string;
  formattedColumnName: string; // e.g., "status (e.g., 'completed')"
  description?: string;
}

/**
 * Specialized service for generating example values for database columns
 * This service analyzes column names and data types to provide realistic examples
 */
@Injectable()
export class ColumnExampleAgentService {
  private readonly logger = new Logger(ColumnExampleAgentService.name);
  private exampleAgent: Agent | null = null;

  constructor(
    @Inject(forwardRef(() => McpClientService))
    private readonly mcpClientService: McpClientService
  ) {}

  /**
   * Initialize the column example agent
   */
  private async initializeExampleAgent(): Promise<void> {
    if (this.exampleAgent) {
      return; // Already initialized
    }

    try {
      const mcpClient = await this.mcpClientService.initializeMcpClient();

      if (!mcpClient) {
        throw new Error('MCP client not available or not connected');
      }

      this.exampleAgent = mcpClient.getAgent('columnExampleAgent');

      this.logger.log('✅ Column example agent initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize column example agent:', error);
      throw error;
    }
  }

  /**
   * Generate example values for multiple columns
   */
  async generateColumnExamples(inputs: ColumnExampleInput[]): Promise<ColumnExampleResult[]> {
    try {
      await this.initializeExampleAgent();

      if (!this.exampleAgent) {
        throw new Error('Column example agent not initialized');
      }

      this.logger.log(`🔍 Generating examples for ${inputs.length} columns`);

      const runtimeContext = createRuntimeContext<{ inputs: ColumnExampleInput[] }>({
        inputs,
      });

      this.logger.debug('Prompt for generate examples for column:', prompt);

      // Use the specialized agent to generate examples with retry logic
      const response = await this.exampleAgent.generate(
        [
          {
            role: 'user',
            content:
              'Generate realistic example values for the following database columns using the provided sample data in the runtime context',
          },
        ],

        {
          runtimeContext,
        }
      );
      this.logger.log('✅ Column examples generated successfully', {
        usage: response.usage,
      });

      // Parse the response to extract structured examples
      const results = this.parseExampleResponse(response.text, inputs);

      return results;
    } catch (error) {
      this.logger.error('❌ Failed to generate column examples:', error);

      // Fallback to basic example generation
      return this.generateFallbackExamples(inputs);
    }
  }

  /**
   * Parse the agent response to extract structured examples
   */
  private parseExampleResponse(
    responseText: string,
    inputs: ColumnExampleInput[]
  ): ColumnExampleResult[] {
    try {
      this.logger.debug('Raw response text:', responseText);

      // Try to extract JSON from the response
      let jsonText = responseText;

      // Remove Markdown code block markers if present
      jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '');

      // Try to find JSON array in the response
      const jsonArrayMatch = jsonText.match(/\[[\s\S]*\]/);

      if (jsonArrayMatch) {
        jsonText = jsonArrayMatch[0];
      } else {
        // Try to find JSON object in the response
        const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/);

        if (jsonObjectMatch) {
          jsonText = jsonObjectMatch[0];
        }
      }

      jsonText = jsonText.trim();

      this.logger.debug('Extracted JSON text:', jsonText);

      const parsed = JSON.parse(jsonText || '[]');

      // Ensure we have an array
      const results = Array.isArray(parsed) ? parsed : [parsed];

      // Validate the structure
      if (
        results.length > 0 &&
        results.every(
          (item) =>
            item.columnName && typeof item.exampleValue !== 'undefined' && item.formattedColumnName
        )
      ) {
        // If we have fewer results than inputs, pad with fallbacks
        if (results.length < inputs.length) {
          const missingInputs = inputs.slice(results.length);
          const fallbackResults = this.generateFallbackExamples(missingInputs);

          results.push(...fallbackResults);
        }

        return results.slice(0, inputs.length); // Ensure we don't return more than expected
      }

      throw new Error('Invalid response structure');
    } catch (error) {
      this.logger.error('❌ Failed to parse example response:', error);
      this.logger.error('Response text was:', responseText);

      // Fallback to basic example generation
      return this.generateFallbackExamples(inputs);
    }
  }

  /**
   * Generate fallback examples when agent fails
   */
  private generateFallbackExamples(inputs: ColumnExampleInput[]): ColumnExampleResult[] {
    return inputs.map((input) => {
      return {
        columnName: input.columnName,
        exampleValue: '',
        formattedColumnName: input.columnName,
      };
    });
  }
}
