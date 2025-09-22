import { McpClientService } from '@/modules/mcp-client';
import { Agent } from '@mastra/core';
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { GetOpenRouter } from '@supplysense/utils';

@Injectable()
export class TestAgentService {
  private metadataAgent: Agent | null = null;
  private readonly openrouter = new GetOpenRouter();
  private readonly logger = new Logger(TestAgentService.name);
  constructor(
    @Inject(forwardRef(() => McpClientService))
    private readonly mcpClientService: McpClientService
  ) {}

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
        name: 'simple-math-agent',
        description: 'you have to answer questions about simple math',
        instructions:
          'You are a simple math agent that can answer questions about simple math operations.',
        model: this.openrouter.getModel(AI_MODEL_NAMES.DEEPSEEK),
        tools,
      });

      this.logger.log('✅ Table metadata agent initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize table metadata agent:', error);
      throw error;
    }
  }
  async test() {
    await this.initializeMetadataAgent();
    if (!this.metadataAgent) {
      this.logger.error('Metadata agent is not initialized.');
      return;
    }

    const questions = [
      'What is 2 + 2?',
      'What is 7 * 6?',
      'What is 15 - 4?',
      'What is 81 / 9?',
      'What is the square of 5?',
    ];
    try {
      const response = await this.metadataAgent.generate(
        [
          {
            role: 'system',
            content:
              'You are a simple math agent that can answer questions about simple math operations.',
          },
          {
            role: 'user',
            content: JSON.stringify(questions, null, 2),
            // content: 'What is 2 + 5?',
          },
        ],
        {
          toolChoice: {
            type: 'tool',
            toolName: 'supplySense_testMetadataTool',
          },
        }
      );
      this.logger.log('🔍 Agent response:', response);
      this.logger.log('🔍 Agent Text response:', response.text);
      this.logger.log(
        '🔍 Agent response:',
        response.toolResults.map((result) => result.result)
      );
      // parse the response to extract answers
      const parseResponse = response.text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line);
      return parseResponse;
    } catch (error) {
      this.logger.error('❌ Error during test agent generation:', error);
    }
  }
}
