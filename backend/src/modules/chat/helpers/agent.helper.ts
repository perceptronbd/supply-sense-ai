import { Agent } from '@mastra/core/agent';
import { McpClientService } from '@modules/mcp-client/services/mcp-client.service';
import { Logger } from '@nestjs/common';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { GetOpenRouter } from '@supplysense/utils';

const logger = new Logger('AgentHelper');
const openrouter = new GetOpenRouter();

export async function initializeChatAgent(mcpClientService: McpClientService): Promise<Agent> {
  try {
    const mcpClient = mcpClientService.getMcpClient();
    if (!mcpClient || !mcpClientService.isClientConnected()) {
      throw new Error('MCP client not available or not connected');
    }

    // Get all available tools from MCP server
    const tools = await mcpClient.getTools();
    const chatAgent = new Agent({
      name: 'ChatAgent',
      description:
        'An intelligent AI assistant powered by SupplySense that specializes in supply chain analytics, inventory optimization, logistics planning, procurement insights, and database-driven decision making for enterprise supply chain operations',
      instructions:
        'You are a supply chain AI assistant, called SupplySense. Use the available tools to help with supply chain queries, inventory management, and logistics operations.',
      model: openrouter.getModel(AI_MODEL_NAMES.GPT_4_NANO),
      tools,
    });

    logger.log('✅ Chat agent initialized successfully');
    return chatAgent;
  } catch (error) {
    logger.error('❌ Failed to initialize chat agent:', error);
    throw error;
  }
}

export async function initializeSummaryAgent(): Promise<Agent> {
  try {
    const summaryAgent = new Agent({
      name: 'SummaryAgent',
      description:
        'An intelligent AI assistant that specializes in summarizing conversation history for supply chain operations',
      instructions:
        'You are a conversation summary AI assistant. Your task is to analyze conversation history and provide concise, meaningful summaries. Focus on key points, decisions made, and important context.',
      model: openrouter.getModel(AI_MODEL_NAMES.GPT_4_NANO),
    });

    logger.log('✅ Summary agent initialized successfully');
    return summaryAgent;
  } catch (error) {
    logger.error('❌ Failed to initialize summary agent:', error);
    throw error;
  }
}
