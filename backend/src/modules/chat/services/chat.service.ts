import { McpClientService } from '@modules/mcp-client/services/mcp-client.service';
import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { PrismaService } from '@supplysense/prisma';
import type { IChatFormattedResult } from '@supplysense/types';
import { createRuntimeContext } from '@supplysense/utils/server';
import axios from 'axios';
import { appConfig } from '@/config/app.config';
import { TokenAndCredit } from '@/modules/common/services/tokenAndCredit.service';
import { MessageType, type RecordTokenUsageDto } from '../dto/chat.dto';
import { AIChatResponse, QueryContext } from '../interfaces/chat.interface';
import { extractWorkflowResult } from '../utils/chat-utils';
import { MessageService } from './message.service';
import { SessionService } from './session.service';

interface IProcessUserMessage {
  companyId: string;
  sessionId: string;
  message: string;
  userId: string;
  dbConnectionId: string;
  userContext: Partial<QueryContext>;
  authorizationToken?: string;
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
    @Inject(forwardRef(() => TokenAndCredit))
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

      await this.ensureDbConnectionExists(dbConnectionId, companyId);

      const agent = await mcpClient.getAgent('chatAgent');
      this.logger.log('sessionId:', sessionId);
      this.logger.log('userId:', userId);
      this.logger.log('Agent:', agent);

      const runtimeContext = createRuntimeContext({ dbConnectionId });

      const aiResponse = await agent.generate(
        [
          {
            role: 'user',
            content: message,
          },
        ],

        {
          runId: sessionId,
          threadId: sessionId,
          resourceId: userId,
          runtimeContext,
        }
      );
      const workflowResult = extractWorkflowResult(aiResponse);

      await this.recordTokenUsage({
        usage: {
          inputTokens: aiResponse.totalUsage.inputTokens,
          outputTokens: aiResponse.totalUsage.outputTokens,
          totalTokens: aiResponse.totalUsage.totalTokens,
        },
        companyId,
        message,
        result: workflowResult,
      });

      await this.messageService.createMessage({
        sessionId,
        content: workflowResult.summary,
        type: MessageType.ASSISTANT,
        structuredData: workflowResult,
      });

      // Generate and update session title based on the conversation
      await this.sessionService.updateSessionTitleIfNeeded(
        sessionId,
        userId,
        message,
        workflowResult.summary
      );

      return {
        message: workflowResult.summary,
        type: 'data',
        data: workflowResult,
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

  async createMessage(
    sessionId: string,
    content: string,
    type: MessageType = MessageType.USER,
    structuredData?: IChatFormattedResult
  ) {
    return this.messageService.createMessage({
      sessionId,
      content,
      type,
      structuredData,
    });
  }

  async updateSessionTitleIfNeeded(
    sessionId: string,
    userId: string,
    message: string,
    aiResponse: string
  ) {
    return this.sessionService.updateSessionTitleIfNeeded(sessionId, userId, message, aiResponse);
  }

  private async ensureDbConnectionExists(dbConnectionId: string, companyId: string): Promise<void> {
    const dbConnectionExist = await this.prismaService.dbConnection.findUnique({
      where: { id: dbConnectionId },
    });

    if (!dbConnectionExist) {
      throw new BadRequestException(
        `Database connection not found for company ${companyId}: ${dbConnectionId}`
      );
    }
  }

  async recordTokenUsage({
    usage,
    companyId,
    message,
    result,
  }: RecordTokenUsageDto): Promise<void> {
    const totalPromptTokens = usage?.inputTokens ?? 0;
    const totalCompletionTokens = usage?.outputTokens ?? 0;

    if (totalPromptTokens === 0 && totalCompletionTokens === 0) {
      return;
    }

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

  /**
   * Stream chat response from Mastra agent
   * @param message - User message to send to the agent
   * @returns Async iterable of text chunks
   */
  async streamChat({
    sessionId,
    message,
    userId,
    dbConnectionId = '',
    userContext: _,
    companyId,
    authorizationToken,
  }: IProcessUserMessage) {
    try {
      // Check if the user has sufficient credits to continue with the chat
      await this.tokenAndCredit.canContinueForChat(companyId);

      // Update the last activity timestamp for the session
      await this.sessionService.updateLastActivity(sessionId);

      // Save the user's message to the database
      await this.messageService.createMessage({
        sessionId,
        content: message,
        type: MessageType.USER,
      });

      await this.ensureDbConnectionExists(dbConnectionId, companyId);

      const response = await axios.post(
        `${appConfig.mcpBackendServerUrl}/chat`,
        { message, sessionId, userId, dbConnectionId, authorizationToken, companyId },
        { responseType: 'stream' }
      );
      return response.data;
    } catch (error) {
      this.logger.error('Error streaming chat response:', error);
      throw error;
    }
  }
}
