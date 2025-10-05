import { TokenAndCredit } from '@/modules/common/services/tokenAndCredit.service';
import { Agent } from '@mastra/core/agent';
import { McpClientService } from '@modules/mcp-client/services/mcp-client.service';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@supplysense/prisma';
import { MessageType } from '../dto/chat.dto';
import { initializeSummaryAgent } from '../helpers/agent.helper';

import { RuntimeContext } from '@mastra/core/runtime-context';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import type { IChatFormattedResult } from '@supplysense/types';
import { withRetry } from '@supplysense/utils/server';
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
  private chatAgent: Agent | null = null;
  private summaryAgent: Agent | null = null;

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
   * Initialize the summary agent if it hasn't been initialized yet
   * This agent is responsible for summarizing conversation history
   */
  private async initializeSummaryAgent(): Promise<void> {
    // Check if agent is already initialized to avoid redundant initialization
    if (this.summaryAgent) {
      return;
    }

    try {
      // Use the helper function to initialize the summary agent
      this.summaryAgent = await initializeSummaryAgent();
    } catch (error) {
      this.logger.error('Failed to initialize summary agent:', error);
      throw error;
    }
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
      // If not, this will throw an error
      await this.tokenAndCredit.canContinueForChat(companyId);

      // Ensure the chat agent is initialized before processing
      const mcpClient = await this.mcpClientService.initializeMcpClient();
      if (!mcpClient) {
        throw new Error('Chat agent not initialized');
      }

      // Log the incoming message for debugging purposes
      this.logger.log(
        `Processing user message: "${message}" for user ${userId} in session ${sessionId}`
      );

      // Update the last activity timestamp for the session
      await this.sessionService.updateLastActivity(sessionId);
      this.logger.log('Session activity updated');

      // Save the user's message to the database
      await this.messageService.createMessage({
        sessionId,
        content: message,
        type: MessageType.USER,
      });

      // Retrieve recent session history for context (last 10 messages)
      const sessionHistory = await this.messageService.getSessionMessages(sessionId, 10);
      this.logger.log(`Retrieved ${sessionHistory.length} session history messages`);

      // Verify that the database connection exists
      const dbConnectionExist = await this.prismaService.dbConnection.findUnique({
        where: { id: dbConnectionId },
      });

      // If the database connection doesn't exist, throw an error
      if (!dbConnectionExist) {
        this.logger.error(`Database connection not found: ${dbConnectionId}`);
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

      const generateWithRetry = () =>
        agent.generate(
          [
            {
              role: 'user',
              content: generateChatAgentUserPrompt(dbConnectionId, userId, '', message),
            },
          ],
          {
            runtimeContext,
            // toolChoice: {
            //   type: 'tool',
            //   toolName: 'chat_query_processing',
            // },
          }
        );

      const aiResponse = await withRetry(
        generateWithRetry,
        3, // maxRetries
        1000 // initial delay in ms (will be doubled each retry)
      );

      const totalPromptTokens = aiResponse.totalUsage.inputTokens;
      const totalCompletionTokens = aiResponse.totalUsage.outputTokens;

      this.logger.debug('AI response generated successfully after retries', aiResponse.text);

      const parsedResult = JSON.parse(aiResponse.text || '{}');

      const result = parsedResult as IChatFormattedResult;
      this.logger.log('result:', result);

      // // Calculate and record token usage for billing
      if (totalPromptTokens > 0 || totalCompletionTokens > 0) {
        this.logger.debug('Total tokens used:', totalPromptTokens, totalCompletionTokens);

        await this.tokenAndCredit.tokenPriceCalculate({
          companyId,
          inputTokens: totalPromptTokens,
          outputTokens: totalCompletionTokens,
          modelUsed: AI_MODEL_NAMES.GPT_4_NANO,
          metadata: {
            question: message,
            answer: result.summary,
            structuredData: JSON.stringify(result),
          },
        });
      }

      await this.messageService.createMessage({
        sessionId,
        content: result.summary,
        type: MessageType.ASSISTANT,
      });

      // Generate and update session title based on the conversation
      await this.sessionService.updateSessionTitleIfNeeded(
        sessionId,
        userId,
        message,
        result.summary
      );

      return {
        message: result.summary,
        type: 'data',
        data: result,
        sessionId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to process user message:', error);
      this.logger.error('Error stack:', error.stack);

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
