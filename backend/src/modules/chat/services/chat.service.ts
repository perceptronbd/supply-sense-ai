import { TokenAndCredit } from '@/modules/common/services/tokenAndCredit.service';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { McpClientService } from '@modules/mcp-client/services/mcp-client.service';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { PrismaService } from '@supplysense/prisma';
import type { IChatFormattedResult } from '@supplysense/types';
import { MessageType } from '../dto/chat.dto';
import { generateChatAgentUserPrompt } from '../helpers/prompt.helper';
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

  /**
   * Process a user message and generate an AI response
   * This is the main method that handles user queries and generates responses
   */
  async processUserMessage({
    sessionId,
    message,
    userId,
    dbConnectionId = '',
    userContext: _,
    companyId,
  }: IProcessUserMessage): Promise<AIChatResponse> {
    try {
      // Check if the user has sufficient credits to continue with the chat
      await this.tokenAndCredit.canContinueForChat(companyId);

      // Ensure the chat agent is initialized before processing
      const mcpClient = await this.mcpClientService.initializeMcpClient();
      if (!mcpClient) {
        throw new Error('Chat agent not initialized');
      }

      // Update the last activity timestamp for the session
      await this.sessionService.updateLastActivity(sessionId);

      // Save the user's message to the database
      await this.messageService.createMessage({
        sessionId,
        content: message,
        type: MessageType.USER,
      });

      // Verify that the database connection exists
      const dbConnectionExist = await this.prismaService.dbConnection.findUnique({
        where: { id: dbConnectionId },
      });

      // If the database connection doesn't exist, throw an error
      if (!dbConnectionExist) {
        throw new BadRequestException(`Database connection not found: ${dbConnectionId}`);
      }

      const agents = await mcpClient.getAgents();
      this.logger.log('Agents:', agents);

      const agent = await mcpClient.getAgent('chatWorkflowAgent');
      this.logger.log('Agent:', agent);

      // Create RuntimeContext and set your dynamic values
      const runtimeContext = new RuntimeContext<{ dbConnectionId: string; userQuery: string }>();
      runtimeContext.set('dbConnectionId', dbConnectionId);
      runtimeContext.set('userQuery', message);

      const aiResponse = await agent.generate(
        [
          {
            role: 'user',
            content: generateChatAgentUserPrompt(dbConnectionId, userId, '', message),
          },
        ],
        {
          runtimeContext,
        }
      );

      this.logger.log('AI Response:', JSON.parse(JSON.stringify(aiResponse)));
      this.logger.log('AI Response: ', aiResponse.text);
      // @ts-ignore
      this.logger.log('AI Tool Results: ', aiResponse.toolResults[0].payload.result);

      const totalPromptTokens = aiResponse.totalUsage.inputTokens;
      const totalCompletionTokens = aiResponse.totalUsage.outputTokens;

      const parsedResult = JSON.parse(aiResponse.text || '{}');

      const result = parsedResult as IChatFormattedResult;

      //Calculate and record token usage for billing
      if (totalPromptTokens > 0 || totalCompletionTokens > 0) {
        await this.tokenAndCredit.tokenPriceCalculate({
          companyId,
          inputTokens: totalPromptTokens,
          outputTokens: totalCompletionTokens,
          modelUsed: AI_MODEL_NAMES.GPT_4_NANO,
          metadata: {
            question: message,
            answer: result.response,
            structuredData: JSON.stringify(result),
          },
        });
      }

      await this.messageService.createMessage({
        sessionId,
        content: result.response,
        type: MessageType.ASSISTANT,
      });

      // Generate and update session title based on the conversation
      await this.sessionService.updateSessionTitleIfNeeded(
        sessionId,
        userId,
        message,
        result.response
      );

      return {
        message: result.response,
        type: 'data',
        data: result,
        sessionId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to process user message:', error);

      // Create error message in the database
      await this.messageService.createMessage({
        sessionId,
        content:
          'I apologize, but I encountered an error processing your request. Please try again.',
        type: MessageType.ERROR,
      });

      // Return an error response to the caller
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
