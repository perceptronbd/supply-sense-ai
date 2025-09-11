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
import { initializeChatAgent, initializeSummaryAgent } from '../helpers/agent.helper';
import {
  generateChatAgentSystemPrompt,
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
    userContext,
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

      // Extract additional context from userContext if available
      // This might include permissions, preferences, or other relevant information
      const additionalContext = userContext
        ? Object.entries(userContext)
            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
            .join('\n')
        : '';

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

      // Get the MCP client and available toolsets
      const mcpClient = this.mcpClientService.getMcpClient();
      const toolsets = await mcpClient.getToolsets();

      // Track token usage for billing purposes
      let totalPromptTokens = 0;
      let totalCompletionTokens = 0;

      // Generate the AI response with retry logic in case of failures
      const agentResponse = await withRetry(
        async () => {
          // Use the chat agent to process the message with a system prompt
          return this.chatAgent.generate(
            [
              {
                role: 'system',
                // Generate a detailed system prompt with all necessary context
                content: generateChatAgentSystemPrompt(
                  dbConnectionId,
                  userId,
                  additionalContext,
                  summarizeConversationHistory,
                  message
                ),
              },
              {
                role: 'user',
                content: message,
              },
            ],
            {
              toolsets,
              // Track token usage for each step of the generation process
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
        3, // Maximum number of retries
        1000 // Initial delay between retries in milliseconds
      );

      // Extract the AI response text or provide a fallback
      const aiResponse = agentResponse.text || 'I apologize, but I could not process your request.';
      this.logger.log('AI response generated successfully', aiResponse);

      // Define the type for the parsed response
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

      // Extract the response message and data from the parsed response
      const responseMessage = parsedResponse.message || aiResponse;
      const responseData = parsedResponse.formattedData;

      // Calculate and record token usage for billing
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

      // Save the AI's response to the database
      await this.messageService.createMessage({
        sessionId,
        content: responseMessage,
        type: MessageType.ASSISTANT,
        structuredData: parsedResponse,
      });

      this.logger.log('Assistant message created successfully');

      // Return the final response to the caller
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
