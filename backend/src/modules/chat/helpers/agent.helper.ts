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
        'An intelligent AI assistant powered by SupplySense that specializes in database analytics, business intelligence, and data-driven decision making across all industries and business domains',

      instructions: `You are SupplySense, an expert database analyst and business intelligence assistant. 

      You help users across all industries extract insights from their data through intelligent querying, analysis, and visualization. Your strength lies in understanding business context, translating questions into actionable database queries, and presenting results in ways that drive decision-making.

      Be conversational, helpful, and focused on delivering business value through data analysis. Use your available tools systematically to analyze queries, execute database operations, and format results for maximum clarity and impact.

      Always explain what you're doing and why, and help users understand both their data and the insights it reveals`,
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

export async function initializeTitleAgent(): Promise<Agent> {
  try {
    const titleAgent = new Agent({
      name: 'TitleAgent',
      description:
        'An intelligent AI assistant that specializes in generating meaningful session titles based on user questions and AI responses',
      instructions:
        'You are a session title generation AI assistant. Your task is to analyze user questions and AI responses to create concise, descriptive session titles that capture the essence of the conversation. Focus on the main topic, data being analyzed, or business question being addressed.',
      model: openrouter.getModel(AI_MODEL_NAMES.GPT_4_NANO),
    });

    logger.log('✅ Title agent initialized successfully');
    return titleAgent;
  } catch (error) {
    logger.error('❌ Failed to initialize title agent:', error);
    throw error;
  }
}
