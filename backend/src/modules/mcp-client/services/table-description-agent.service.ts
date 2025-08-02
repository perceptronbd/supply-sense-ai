import { Agent } from '@mastra/core/agent';
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { AI_MODEL_NAME } from '@supplysense/constant';
import { McpClientService } from './mcp-client.service';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export interface GenerateDescriptionInput {
  tableName: string;
  columnName: string;
  refTable: string;
  refColumn: string;
  businessContext?: string;
}

/**
 * Specialized service for generating table relationship descriptions using MCP tools
 * This service focuses specifically on table relationship analysis and description generation
 */
@Injectable()
export class TableDescriptionAgentService {
  private readonly logger = new Logger(TableDescriptionAgentService.name);
  private descriptionAgent: Agent | null = null;

  constructor(
    @Inject(forwardRef(() => McpClientService))
    private readonly mcpClientService: McpClientService
  ) {}

  /**
   * Initialize the table description agent with specific tools for relationship analysis
   */
  private async initializeDescriptionAgent(): Promise<void> {
    if (this.descriptionAgent) {
      return; // Already initialized
    }

    try {
      // Check for OpenRouter API key first
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error(
          'OPENROUTER_API_KEY environment variable is not set. Please add it to your .env file.'
        );
      }

      const mcpClient = this.mcpClientService.getMcpClient();
      if (!mcpClient || !this.mcpClientService.isClientConnected()) {
        throw new Error('MCP client not available or not connected');
      }

      // Get tools from MCP client
      const tools = await mcpClient.getTools();

      this.descriptionAgent = new Agent({
        name: 'TableDescriptionAgent',
        description:
          'AI assistant specialized in generating user-friendly table relationship descriptions',
        instructions: `You are a business analyst who explains database relationships in simple, user-friendly terms. 
    Your task is to generate descriptions that help business users understand what the data relationships mean for their work and AI analysis.

    Guidelines:
    1. Focus on the business meaning and practical implications
    2. Explain how this relationship helps with data analysis, reporting, or AI insights
    3. Use simple, everyday business language - avoid technical jargon
    4. Start with what the relationship means, then explain why it's useful
    5. Keep descriptions conversational and helpful (2-3 sentences max)
    6. Think about how this helps users group, filter, or analyze their data

    Format:
    - Start with "This means..." or "This shows..." 
    - Explain the business relationship in simple terms
    - Add how this helps with analysis: "This helps the AI..." or "Confirming this allows..."
    - Keep it under 200 characters total
    - Use present tense and active voice

    Examples:
    - "This means every order belongs to a customer. Confirming this helps the AI group orders by customer for better insights."
    - "This shows products are organized into categories. This allows the AI to analyze sales trends by product type."
    - "This means purchases are linked to specific suppliers. This helps track which vendors provide which products."`,
        model: openrouter(AI_MODEL_NAME),
        tools,
      });

      this.logger.log('✅ Table description agent initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize table description agent:', error);
      throw new Error('Failed to initialize table description agent');
    }
  }

  /**
   * Generate a description for a table relationship
   */
  async generateTableDescription(input: GenerateDescriptionInput): Promise<string> {
    try {
      // Validate input parameters
      const { tableName, columnName, refTable, refColumn, businessContext } = input;

      if (!tableName || !columnName || !refTable || !refColumn) {
        throw new Error('Missing required relationship parameters');
      }

      this.logger.debug(
        `Generating description for relationship: ${tableName}.${columnName} -> ${refTable}.${refColumn}`
      );

      // Check API key before initializing
      if (!process.env.OPENROUTER_API_KEY) {
        this.logger.error('OPENROUTER_API_KEY is not configured');
        throw new Error('OpenRouter API key is not configured');
      }

      await this.initializeDescriptionAgent();

      if (!this.descriptionAgent) {
        throw new Error('Table description agent not initialized');
      }

      const prompt = `Database Relationship Analysis:
- Table: ${tableName}
- Field: ${columnName}
- Connected to: ${refTable}.${refColumn}
${businessContext ? `\nBusiness Context: ${businessContext}` : ''}

Please explain what this relationship means for business users and how it helps with data analysis. Write in simple, user-friendly language that explains the practical value.`;

      this.logger.debug('Sending prompt to agent:', { prompt });

      // Add timeout to the agent call
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Agent call timed out after 30 seconds')), 30000)
      );

      const agentPromise = this.descriptionAgent.generate([
        {
          role: 'user',
          content: prompt,
        },
      ]);

      const response = (await Promise.race([agentPromise, timeoutPromise])) as {
        text: string;
      };

      this.logger.debug('Received response from agent:', {
        text: response?.text,
        hasText: !!response?.text,
      });

      if (!response?.text) {
        throw new Error('Agent returned empty or invalid response');
      }

      let description = response.text.trim();

      if (!description) {
        throw new Error('Agent returned empty description');
      }

      // Remove leading and trailing quotes or markdown formatting if present
      description = description.replace(/^["'`*]+\s*/, '').replace(/\s*["'`*]+$/, '');

      this.logger.log(
        `✅ Generated description for ${tableName}.${columnName} -> ${refTable}.${refColumn}: ${description}`
      );
      return description;
    } catch (error) {
      // Check for specific OpenRouter errors
      if (error.message === 'Payment Required') {
        this.logger.error(
          '💳 OpenRouter account needs payment. Please add credits to your OpenRouter account at https://openrouter.ai/'
        );
      } else {
        this.logger.error(
          `❌ Error generating description for relationship ${input.tableName}.${input.columnName} -> ${input.refTable}.${input.refColumn}:`,
          {
            error: error.message || error,
            stack: error.stack,
            input: {
              tableName: input.tableName,
              columnName: input.columnName,
              refTable: input.refTable,
              refColumn: input.refColumn,
              businessContext: input.businessContext,
            },
          }
        );
      }

      // Return a user-friendly fallback description instead of throwing
      const fallback = `This means ${input.tableName} records are connected to ${input.refTable} records. This helps organize and link related data.`;
      this.logger.warn(`Using fallback description: ${fallback}`);
      return fallback;
    }
  }

  /**
   * Generate descriptions for multiple table relationships
   */
  async generateMultipleDescriptions(inputs: GenerateDescriptionInput[]): Promise<string[]> {
    const descriptions: string[] = [];

    for (const input of inputs) {
      try {
        const description = await this.generateTableDescription(input);
        descriptions.push(description);
      } catch (error) {
        this.logger.error(
          `❌ Error generating description for ${input.tableName}.${input.columnName}:`,
          error
        );
        // Add user-friendly fallback description
        descriptions.push(
          `This means ${input.tableName} records are connected to ${input.refTable} records. This helps organize and link related data.`
        );
      }
    }

    return descriptions;
  }
}
