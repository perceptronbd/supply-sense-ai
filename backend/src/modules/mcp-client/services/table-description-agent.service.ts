import { MastraClient } from '@mastra/client-js';
import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { TokenAndCredit } from '@/modules/common/services/tokenAndCredit.service';
import { McpClientService } from './mcp-client.service';

type TAgent = Awaited<ReturnType<MastraClient['getAgent']>>;

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
  private descriptionAgent: TAgent | null = null;

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

      const mcpClient = await this.mcpClientService.initializeMcpClient();
      if (!mcpClient || !this.mcpClientService.isClientConnected()) {
        throw new Error('MCP client not available or not connected');
      }

      this.descriptionAgent = await mcpClient.getAgent('tableDescriptionAgent');

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

      await this.initializeDescriptionAgent();

      if (!this.descriptionAgent) {
        throw new Error('Table description agent not initialized');
      }

      this.logger.debug('Sending batch prompt to agent for multiple relationships');

      const hasAvailableCredit = await this.tokenAndCredit.isAvailableCredit(companyId);
      if (!hasAvailableCredit) {
        this.logger.error('Insufficient credit for generating descriptions');
        throw new BadRequestException('Insufficient credit');
      }

      const response = await this.descriptionAgent.generate([], {
        runtimeContext: {
          inputs,
        },
      });

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
          inputTokens: response.usage.inputTokens,
          outputTokens: response.usage.outputTokens,
          isDeductCredit: true, //NOTE:THIS WILL BE REMOVE AFTER TESTING
          metadata: {
            question: JSON.stringify(inputs),
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
