import { TokenAndCredit } from '@/modules/common/services/tokenAndCredit.service';
import { WorkflowService } from '@/modules/mastra-workflow/mastra-workflow.service';
import { Agent } from '@mastra/core/agent';
import { McpClientService } from '@modules/mcp-client/services/mcp-client.service';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { PrismaService } from '@supplysense/prisma';
import { withRetry } from '@supplysense/utils/server';
import { MessageType } from '../dto/chat.dto';
import { initializeChatAgent, initializeSummaryAgent } from '../helpers/agent.helper';
import {
  generateChatAgentUserPrompt,
  generateSummaryAgentSystemPrompt,
} from '../helpers/prompt.helper';
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
    private readonly tokenAndCredit: TokenAndCredit,
    @Inject(WorkflowService)
    private readonly workflowService: WorkflowService
  ) {
    this.logger.log('ChatService constructor called - using MCP for all AI queries');
  }

  /**
   * Initialize the chat agent if it hasn't been initialized yet
   * This agent is responsible for processing user queries and interacting with database tools
   */
  private async initializeChatAgent(): Promise<void> {
    // Check if agent is already initialized to avoid redundant initialization
    if (this.chatAgent) {
      return;
    }

    try {
      // Use the helper function to initialize the chat agent
      this.chatAgent = await initializeChatAgent(this.mcpClientService);
    } catch (error) {
      this.logger.error('Failed to initialize chat agent:', error);
      throw error;
    }
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

  //   Generate a summary of the conversation history
  async generateConversationSummary(conversationHistory: string[]): Promise<string> {
    try {
      // Ensure the summary agent is initialized
      await this.initializeSummaryAgent();
      if (!this.summaryAgent) {
        throw new Error('Summary agent not initialized');
      }

      // Format the conversation history for processing
      const formattedHistory = conversationHistory
        .map((msg, index) => `Message ${index + 1}: ${msg}`)
        .join('\n');

      // Generate summary using the summary agent with a system prompt
      const agentResponse = await this.summaryAgent.generate(
        [
          {
            role: 'system',
            content: generateSummaryAgentSystemPrompt(formattedHistory),
          },
          {
            role: 'user',
            content: formattedHistory,
          },
        ],
        {}
      );

      // Extract the summary text or provide a fallback
      const summary = agentResponse.text || 'No summary available.';
      this.logger.debug('Conversation summary generated successfully', summary);
      return summary;
    } catch (error) {
      this.logger.error('Failed to generate conversation summary:', error);
      return 'Failed to generate conversation summary.';
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
      await this.initializeChatAgent();
      if (!this.chatAgent) {
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

      // Generate a summary of the conversation history to provide context
      const summarizeConversationHistory = await this.generateConversationSummary(
        sessionHistory.map((msg) => msg.content)
      );

      let totalPromptTokens = 0;
      let totalCompletionTokens = 0;

      const generateWithRetry = () =>
        this.chatAgent.generate(
          [
            {
              role: 'user',
              content: generateChatAgentUserPrompt(
                dbConnectionId,
                userId,
                summarizeConversationHistory,
                message
              ),
            },
          ],
          {
            toolChoice: {
              type: 'tool',
              toolName: 'supplySense_run_chatWorkflow',
            },
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

      const aiResponse = await withRetry(
        generateWithRetry,
        3, // maxRetries
        1000 // initial delay in ms (will be doubled each retry)
      );

      this.logger.debug('AI response generated successfully after retries');
      const parsedResult = JSON.parse(aiResponse.toolResults[0].result.content?.[0].text || '{}');
      const result = parsedResult.result;
      this.logger.log('result:', result);

      // Calculate and record token usage for billing
      if (totalPromptTokens > 0 || totalCompletionTokens > 0) {
        this.logger.debug('Total tokens used:', totalPromptTokens, totalCompletionTokens);

        await this.tokenAndCredit.tokenPriceCalculate({
          companyId,
          inputTokens: totalPromptTokens,
          outputTokens: totalCompletionTokens,
          modelUsed: AI_MODEL_NAMES.GPT_4_NANO,
          metadata: {
            question: message,
            answer: result.message,
            structuredData: JSON.stringify(result),
          },
        });
      }

      await this.messageService.createMessage({
        sessionId,
        content: result.message,
        type: MessageType.ASSISTANT,
        structuredData: result,
      });

      return {
        message: result.message,
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
