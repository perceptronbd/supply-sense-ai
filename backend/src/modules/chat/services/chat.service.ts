import { TokenAndCredit } from '@/modules/common/services/tokenAndCredit.service';
import { Agent } from '@mastra/core/agent';
import { McpClientService } from '@modules/mcp-client/services/mcp-client.service';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { PrismaService } from '@supplysense/prisma';
import { GetOpenRouter } from '@supplysense/utils';
import { withRetry } from '@supplysense/utils/server';
import { VisualizationType } from '../constant';
import { MessageType } from '../dto/chat.dto';
import { AIChatResponse, QueryContext } from '../interfaces/chat.interface';
import { MessageService } from './message.service';
import { SessionService } from './session.service';

interface IProcessUserMessage {
  companyId: string;
  sessionId: string;
  message: string;
  userId: string;
  dbConnectionId: string;
  userContext: Partial<QueryContext>;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private chatAgent: Agent | null = null;
  private summaryAgent: Agent | null = null;
  private readonly openrouter = new GetOpenRouter();

  constructor(
    @Inject(SessionService) private readonly sessionService: SessionService,
    @Inject(MessageService) private readonly messageService: MessageService,
    @Inject(McpClientService)
    private readonly mcpClientService: McpClientService,
    @Inject(PrismaService)
    private readonly prismaService: PrismaService,
    @Inject(TokenAndCredit)
    private readonly tokenAndCredit: TokenAndCredit
  ) {
    this.logger.log('ChatService constructor called - using MCP for all AI queries');
  }

  private async initializeChatAgent(): Promise<void> {
    if (this.chatAgent) {
      return; // Already initialized
    }

    try {
      const mcpClient = this.mcpClientService.getMcpClient();
      if (!mcpClient || !this.mcpClientService.isClientConnected()) {
        throw new Error('MCP client not available or not connected');
      }

      // Get all available tools from MCP server
      const tools = await mcpClient.getTools();
      this.chatAgent = new Agent({
        name: 'ChatAgent',
        description:
          'An intelligent AI assistant powered by SupplySense that specializes in supply chain analytics, inventory optimization, logistics planning, procurement insights, and database-driven decision making for enterprise supply chain operations',
        instructions:
          'You are a supply chain AI assistant, called SupplySense. Use the available tools to help with supply chain queries, inventory management, and logistics operations.',
        model: this.openrouter.getModel(AI_MODEL_NAMES.GPT_4_NANO),
        tools,
      });
      this.logger.log('✅ Table metadata agent initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize table metadata agent:', error);
      throw error;
    }
  }

  private async initializeSummaryAgent(): Promise<void> {
    if (this.summaryAgent) {
      return; // Already initialized
    }

    try {
      const mcpClient = this.mcpClientService.getMcpClient();
      if (!mcpClient || !this.mcpClientService.isClientConnected()) {
        throw new Error('MCP client not available or not connected');
      }

      this.summaryAgent = new Agent({
        name: 'SummaryAgent',
        description:
          'An intelligent AI assistant that specializes in summarizing conversation history for supply chain operations',
        instructions:
          'You are a conversation summary AI assistant. Your task is to analyze conversation history and provide concise, meaningful summaries. Focus on key points, decisions made, and important context.',
        model: this.openrouter.getModel(AI_MODEL_NAMES.Z_AI),
      });
      this.logger.log('✅ Summary agent initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize summary agent:', error);
      throw error;
    }
  }

  async generateConversationSummary(conversationHistory: string[]): Promise<string> {
    try {
      await this.initializeSummaryAgent();
      if (!this.summaryAgent) {
        throw new Error('Summary agent not initialized');
      }

      // Format the conversation history
      const formattedHistory = conversationHistory
        .map((msg, index) => `Message ${index + 1}: ${msg}`)
        .join('\n');

      // Generate summary using the summary agent
      const agentResponse = await this.summaryAgent.generate(
        [
          {
            role: 'system',
            content: `You are a conversation summary AI assistant. 
          
          Your task is to analyze the conversation history and provide a concise, meaningful summary.
          
          Focus on:
          1. Key topics discussed
          2. Important decisions made
          3. Action items identified
          4. Critical context or information shared
          5. Make it maximum 3 lines.
          
          Keep the summary brief but comprehensive.
          
          Conversation History:
          ${formattedHistory}`,
          },
          {
            role: 'user',
            content: formattedHistory,
          },
        ],
        {}
      );

      const summary = agentResponse.text || 'No summary available.';
      this.logger.debug('Conversation summary generated successfully', summary);
      return summary;
    } catch (error) {
      this.logger.error('Failed to generate conversation summary:', error);
      return 'Failed to generate conversation summary.';
    }
  }

  async processUserMessage({
    sessionId,
    message,
    userId,
    dbConnectionId = '',
    userContext,
    companyId,
  }: IProcessUserMessage): Promise<AIChatResponse> {
    try {
      // if there's no credit left, it will throw error
      await this.tokenAndCredit.canContinueForChat(companyId);

      await this.initializeChatAgent();
      if (!this.chatAgent) {
        throw new Error('Chat agent not initialized');
      }

      this.logger.log(
        `Processing user message: "${message}" for user ${userId} in session ${sessionId}`
      );

      // Update session activity
      await this.sessionService.updateLastActivity(sessionId);
      this.logger.log('Session activity updated');

      // Save user query
      await this.messageService.createMessage({
        sessionId,
        content: message,
        type: MessageType.USER,
      });

      // Get session history for context
      const sessionHistory = await this.messageService.getSessionMessages(sessionId, 10);
      this.logger.log(`Retrieved ${sessionHistory.length} session history messages`);

      // Additional context from userContext if available
      const additionalContext = userContext
        ? Object.entries(userContext)
            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
            .join('\n')
        : '';

      const dbConnectionExist = await this.prismaService.dbConnection.findUnique({
        where: { id: dbConnectionId },
      });

      if (!dbConnectionExist) {
        this.logger.error(`Database connection not found: ${dbConnectionId}`);
        throw new BadRequestException(`Database connection not found: ${dbConnectionId}`);
      }

      const summarizeConversationHistory = await this.generateConversationSummary(
        sessionHistory.map((msg) => msg.content)
      );

      const mcpClient = this.mcpClientService.getMcpClient();
      const toolsets = await mcpClient.getToolsets();

      // Use the chat agent to process the message
      let totalPromptTokens = 0;
      let totalCompletionTokens = 0;

      const agentResponse = await withRetry(
        async () => {
          return this.chatAgent.generate(
            [
              {
                role: 'system',
                content: `You are a database analyst helping with supply chain management queries. 
          
        Available context:
        - Database Connection ID: ${dbConnectionId}
        - User ID: ${userId}
        - Additional Context:
        ${additionalContext}
        - Conversation History:
        ${summarizeConversationHistory}

        You MUST follow this workflow:
        1. First, use the query-analysis-tool with these parameters:
           - dbConnectionId:Database Connection ID
           - userQuery: The user's message/question
        
        2. After getting the analysis, use the execute-query-tool with these parameters:
           - dbConnectionId"
           - queryAnalysis: The analysis result from step 1
           - userQuery: The user's original message "${message}" (for better formatting context)
        
        The execute-query-tool will now handle formatting internally and return:
        - sqlQuery: The generated SQL query
        - queryResults: The raw database results
        - visualizationType: The recommended display format
        - formattedData: Chart.js compatible data structure or table data
        - summary: Brief description of the data
        `,
              },
              {
                role: 'user',
                content: message,
              },
            ],
            {
              toolsets,
              onStepFinish: async ({ usage }) => {
                if (usage) {
                  this.logger.debug('usage', usage);
                  // Aggregate tokens from each step
                  totalPromptTokens += usage.promptTokens || 0;
                  totalCompletionTokens += usage.completionTokens || 0;
                }
              },
            }
          );
        },
        3, // max retries
        1000 // initial delay in ms
      );

      const aiResponse = agentResponse.text || 'I apologize, but I could not process your request.';
      this.logger.log('AI response generated successfully', aiResponse);

      type TParsedResponse = {
        visualizationType: VisualizationType;
        formattedData: unknown;
        summary: string;
        message: string;
        sqlQuery: string;
        queryResults: unknown;
      };

      // Try to parse the structured JSON response from the agent
      let parsedResponse = {} as TParsedResponse;

      try {
        // Look for JSON in the response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          parsedResponse = JSON.parse(jsonStr);
          this.logger.log('Successfully parsed structured response:', parsedResponse);
        }
      } catch (error) {
        this.logger.warn('Could not parse structured response, using fallback:', error);
      }

      this.logger.debug('Determined parsedResponse:', parsedResponse);

      const responseMessage = parsedResponse.message || aiResponse;
      const responseData = parsedResponse.formattedData;

      // Calculate total tokens used for all steps at once
      if (totalPromptTokens > 0 || totalCompletionTokens > 0) {
        this.logger.debug('Total tokens used:', totalPromptTokens, totalCompletionTokens);
        await this.tokenAndCredit.tokenPriceCalculate({
          companyId,
          inputTokens: totalPromptTokens,
          outputTokens: totalCompletionTokens,
          toolUsed: AI_MODEL_NAMES.Z_AI,
          metadata: {
            question: message,
            answer: responseMessage,
            structuredData: JSON.stringify(parsedResponse),
          },
        });
      }

      // Create assistant message save ai response to db
      await this.messageService.createMessage({
        sessionId,
        content: responseMessage,
        type: MessageType.ASSISTANT,
        structuredData: parsedResponse,
      });

      this.logger.log('Assistant message created successfully');

      return {
        message: responseMessage,
        type: 'data',
        data: responseData,
        sessionId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to process user message:', error);
      this.logger.error('Error stack:', error.stack);

      // Create error message
      await this.messageService.createMessage({
        sessionId,
        content:
          'I apologize, but I encountered an error processing your request. Please try again.',
        type: MessageType.ERROR,
      });

      return {
        message:
          'I apologize, but I encountered an error processing your request. Please try again.',
        type: 'error',
        sessionId,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async createSession(title: string, userId: string, dbConnectionId: string, description?: string) {
    return this.sessionService.createSession(title, userId, dbConnectionId, description);
  }

  async getSession(sessionId: string, userId: string) {
    return this.sessionService.getSession(sessionId, userId);
  }

  async getUserSessions(userId: string, limit?: number, offset?: number) {
    return this.sessionService.getUserSessions(userId, limit, offset);
  }

  async deleteSession(sessionId: string, userId: string) {
    return this.sessionService.deleteSession(sessionId, userId);
  }

  async getSessionMessages(sessionId: string, limit?: number, offset?: number) {
    return this.messageService.getSessionMessages(sessionId, limit, offset);
  }
}
