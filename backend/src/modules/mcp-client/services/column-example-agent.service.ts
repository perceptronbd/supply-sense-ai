import { Agent } from '@mastra/core/agent';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { GetOpenRouter } from '@supplysense/utils';
import { withRetry } from '@supplysense/utils/server';
import { McpClientService } from './mcp-client.service';

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
  private readonly openrouter = new GetOpenRouter();

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
      const mcpClient = this.mcpClientService.getMcpClient();

      if (!mcpClient || !this.mcpClientService.isClientConnected()) {
        throw new Error('MCP client not available or not connected');
      }

      // Get all available tools from MCP server
      const tools = await mcpClient.getTools();

      this.exampleAgent = new Agent({
        name: 'ColumnExampleAgent',
        description:
          'AI agent specialized in generating realistic example values for database columns',
        instructions: [
          'You are an expert database analyst specializing in generating realistic, context-aware example values for database columns.',
          '',
          'PRIMARY OBJECTIVE: Generate the most realistic examples possible by leveraging actual data patterns and semantic understanding.',
          '',
          'DATA UTILIZATION HIERARCHY:',
          '1. **SAMPLE DATA FIRST**: Always prioritize actual sample data when available',
          '   - Select representative values that demonstrate common patterns',
          '   - For varied data, choose the most typical or frequently occurring value',
          '   - Preserve formatting, casing, and structural patterns observed in samples',
          '',
          '2. **COLUMN SEMANTICS**: When samples are unavailable, infer from:',
          '   - Column name semantics (e.g., "email", "status", "created_at")',
          '   - Data type constraints (VARCHAR length, numeric ranges, date formats)',
          '   - Table context and relationships',
          '',
          '3. **SPECIAL CASES**:',
          '   - Enum columns: Use provided enum values or infer dominant values from samples',
          '   - Foreign keys: Generate values that match referenced table patterns',
          '   - Boolean/flag columns: Use appropriate true/false representations',
          '   - Date/time columns: Use recent, realistic timestamps',
          '',
          'VALUE GENERATION PRINCIPLES:',
          '• **Realism over randomness**: Prefer plausible values that reflect real usage',
          '• **Consistency**: Maintain patterns across related columns',
          '• **Brevity**: Keep examples concise but meaningful',
          '• **Format preservation**: Maintain observed formatting conventions',
          '',
          'OUTPUT REQUIREMENTS:',
          'Return a JSON array with objects containing:',
          '- **columnName**: Original column name',
          '- **exampleValue**: Realistic example (prioritize actual sample data)',
          '- **formattedColumnName**: Display format "columnName (e.g., \'example\')"',
          '- **description**: Brief explanation of why this example was chosen, including:',
          '  * Source of example (e.g., "from sample data", "inferred from pattern")',
          '  * Pattern observed (e.g., "email format", "sequential IDs", "status workflow")',
          '  * Any notable constraints or characteristics',
          '',
          'EXAMPLE OUTPUT:',
          '{',
          '  "columnName": "user_status",',
          '  "exampleValue": "active",',
          '  "formattedColumnName": "user_status (e.g., \'active\')",',
          '  "description": "From sample data: represents most common status value; other observed values: pending, inactive"',
          '}',
        ].join('\n'),
        model: this.openrouter.getModel(AI_MODEL_NAMES.GPT_4_NANO),
        tools,
      });

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

      const prompt = this.buildExamplePrompt(inputs);

      this.logger.debug('Prompt for generate examples for column:', prompt);

      // Use the specialized agent to generate examples with retry logic
      const response = await withRetry(
        async () => {
          return await this.exampleAgent?.generate([
            {
              role: 'user',
              content: prompt,
            },
          ]);
        },
        3, // maxRetries
        2000 // 2 second delay
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
   * Build the prompt for generating column examples
   */
  private buildExamplePrompt(inputs: ColumnExampleInput[]): string {
    const columnsData = inputs.map((input) => ({
      tableName: input.tableName,
      columnName: input.columnName,
      dataType: input.dataType,
      isEnum: input.isEnum || false,
      enumValues: input.enumValues || [],
      sampleData: input.sampleData || [],
    }));

    return `Generate realistic example values for the following database columns using the provided sample data:

${JSON.stringify(columnsData, null, 2)}`;
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
