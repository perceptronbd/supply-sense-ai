import { TokenAndCredit } from '@/modules/common/services/tokenAndCredit.service';
import { buildTableDescriptionPrompt } from '@/modules/onboarding/helpers/build-description-prompt';
import { Agent } from '@mastra/core/agent';
import { BadRequestException, Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { GetOpenRouter } from '@supplysense/utils';
import { McpClientService } from './mcp-client.service';

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
  private readonly openRouter = new GetOpenRouter();

  constructor(
    @Inject(forwardRef(() => McpClientService))
    private readonly mcpClientService: McpClientService,
    @Inject(TokenAndCredit)
    private readonly tokenAndCredit: TokenAndCredit
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
        model: this.openRouter.getModel(),
        tools,
      });

      this.logger.log('✅ Table description agent initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize table description agent:', error);
      throw new Error('Failed to initialize table description agent');
    }
  }

  /**
   * Core method to generate descriptions for single or multiple table relationships
   */
  private async generateDescriptions(
    inputs: GenerateDescriptionInput[],
    companyId: string
  ): Promise<string[]> {
    try {
      // Validate all input parameters
      for (const input of inputs) {
        const { tableName, columnName, refTable, refColumn } = input;
        if (!tableName || !columnName || !refTable || !refColumn) {
          throw new Error(
            `Missing required relationship parameters for ${tableName}.${columnName}`
          );
        }
      }

      this.logger.debug(`Generating descriptions for ${inputs.length} relationships`);

      // Check API key before initializing
      if (!process.env.OPENROUTER_API_KEY) {
        this.logger.error('OPENROUTER_API_KEY is not configured');
        throw new Error('OpenRouter API key is not configured');
      }

      await this.initializeDescriptionAgent();

      if (!this.descriptionAgent) {
        throw new Error('Table description agent not initialized');
      }

      const { systemPrompt } = buildTableDescriptionPrompt(inputs);

      this.logger.debug('Sending batch prompt to agent for multiple relationships');

      const hasAvailableCredit = await this.tokenAndCredit.isAvailableCredit(companyId);
      if (!hasAvailableCredit) {
        this.logger.error('Insufficient credit for generating descriptions');
        throw new BadRequestException('Insufficient credit');
      }

      const response = await this.descriptionAgent.generate([
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: JSON.stringify(inputs, null, 2),
        },
      ]);

      this.logger.debug('Received batch response from agent:', {
        hasText: !!response?.text,
        textLength: response?.text?.length,
      });

      if (!response?.text) {
        throw new Error('Agent returned empty or invalid response');
      }

      let responseText = response.text.trim();

      if (!responseText) {
        throw new Error('Agent returned empty description');
      }

      // Try to parse JSON response
      let descriptions: string[];
      try {
        // Remove any markdown code block formatting
        responseText = responseText.replace(/```json\s*/, '').replace(/```\s*$/, '');
        descriptions = JSON.parse(responseText);

        if (!Array.isArray(descriptions)) {
          throw new Error('Response is not an array');
        }

        if (descriptions.length !== inputs.length) {
          this.logger.warn(`Expected ${inputs.length} descriptions but got ${descriptions.length}`);
        }
      } catch {
        this.logger.warn(
          'Failed to parse JSON response, attempting to extract descriptions manually'
        );
        // Fallback: try to extract descriptions from text
        descriptions = this.extractDescriptionsFromText(responseText, inputs.length);
      }

      // Ensure we have the right number of descriptions
      while (descriptions.length < inputs.length) {
        const missingIndex = descriptions.length;
        const input = inputs[missingIndex];
        descriptions.push(
          `This means ${input.tableName} records are connected to ${input.refTable} records. This helps organize and link related data.`
        );
      }

      // Clean up descriptions
      descriptions = descriptions.slice(0, inputs.length).map((desc) =>
        desc
          .replace(/^["'`*]+\s*/, '')
          .replace(/\s*["'`*]+$/, '')
          .trim()
      );

      this.logger.log(`✅ Generated ${descriptions.length} descriptions successfully`, {
        usage: response.usage,
      });

      if (response.usage) {
        await this.tokenAndCredit.tokenPriceCalculate({
          companyId,
          inputTokens: response.usage.promptTokens,
          outputTokens: response.usage.completionTokens,
          isDeductCredit: true, //NOTE:THIS WILL BE REMOVE AFTER TESTING
          metadata: {
            question: systemPrompt,
            answer: JSON.stringify(descriptions),
          },
        });
      }
      return descriptions;
    } catch (error) {
      this.logger.error('❌ Error generating batch descriptions:', error);

      // Return fallback descriptions for all inputs
      return inputs.map(
        (input) =>
          `This means ${input.tableName} records are connected to ${input.refTable} records. This helps organize and link related data.`
      );
    }
  }

  /**
   * Helper method to extract descriptions from non-JSON text response
   */
  private extractDescriptionsFromText(text: string, expectedCount: number): string[] {
    // Try to find numbered or bulleted descriptions
    const patterns = [
      /\d+\.\s*["']?([^"'\n]+)["']?/g,
      /[-*]\s*["']?([^"'\n]+)["']?/g,
      /"([^"]+)"/g,
    ];

    for (const pattern of patterns) {
      const matches = Array.from(text.matchAll(pattern));
      if (matches.length >= expectedCount) {
        return matches.slice(0, expectedCount).map((match) => match[1].trim());
      }
    }

    // Fallback: split by lines and take meaningful ones
    const linePattern = /^[\d\-*[\]{}]+\s*$/;
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 10 && !linePattern.exec(line))
      .slice(0, expectedCount);

    return lines.length > 0 ? lines : [];
  }

  /**
   * Generate descriptions for multiple table relationships
   */
  async generateMultipleDescriptions(
    inputs: GenerateDescriptionInput[],
    companyId: string
  ): Promise<string[]> {
    return this.generateDescriptions(inputs, companyId);
  }
}
