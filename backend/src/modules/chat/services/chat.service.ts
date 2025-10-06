import { RuntimeContext } from '@mastra/core/runtime-context';
import type { MastraModelOutput } from '@mastra/core/stream';
import { McpClientService } from '@modules/mcp-client/services/mcp-client.service';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { PrismaService } from '@supplysense/prisma';
import type { IChatFormattedResult } from '@supplysense/types';
import { TokenAndCredit } from '@/modules/common/services/tokenAndCredit.service';
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

type AgentGenerateResult = Awaited<ReturnType<MastraModelOutput['getFullOutput']>>;

type AgentToolResultPayload = AgentGenerateResult['toolResults'][number]['payload'];

const VALID_VISUALIZATION_TYPES = new Set<IChatFormattedResult['visualizationType']>([
  'table',
  'bar',
  'line',
  'area',
  'radar',
  'text',
]);

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

      await this.ensureDbConnectionExists(dbConnectionId, companyId);

      const agent = await mcpClient.getAgent('chatWorkflowAgent');
      this.logger.log('sessionId:', sessionId);
      this.logger.log('userId:', userId);
      this.logger.log('Agent:', agent);

      const runtimeContext = this.createRuntimeContext(dbConnectionId);

      const aiResponse = (await agent.generate(
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
      )) as AgentGenerateResult;
      const workflowResult = this.extractWorkflowResult(aiResponse);

      await this.recordTokenUsage({
        usage: aiResponse.totalUsage,
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

  private createRuntimeContext(dbConnectionId: string) {
    const runtimeContext = new RuntimeContext<{ dbConnectionId: string }>();
    runtimeContext.set('dbConnectionId', dbConnectionId);
    return runtimeContext;
  }

  private extractWorkflowResult(aiResponse: AgentGenerateResult): IChatFormattedResult {
    const defaultResult: IChatFormattedResult = {
      visualizationType: 'text',
      formattedData: null,
      summary: aiResponse.text,
    };

    const workflowToolPayload = this.getWorkflowToolPayload(aiResponse);
    const nestedResults = this.getWorkflowNestedResults(workflowToolPayload);

    if (!nestedResults) {
      return defaultResult;
    }

    const conversational = nestedResults['conversational-response'];
    if (this.isChatFormattedResult(conversational)) {
      return conversational;
    }

    const analytical = nestedResults['analytical-sub-workflow'];
    if (this.isChatFormattedResult(analytical)) {
      return analytical;
    }

    const reversedEntries = [...Object.entries(nestedResults)].reverse();
    for (const [, value] of reversedEntries) {
      if (this.isChatFormattedResult(value)) {
        return value;
      }
    }

    return defaultResult;
  }

  private getWorkflowToolPayload(
    aiResponse: AgentGenerateResult
  ): AgentToolResultPayload | undefined {
    return aiResponse.toolResults.find(
      (toolResult) => toolResult.payload.toolName === 'chatWorkflow'
    )?.payload;
  }

  private getWorkflowNestedResults(
    payload: AgentToolResultPayload | undefined
  ): Record<string, unknown> | undefined {
    if (!payload) {
      return undefined;
    }

    const { result } = payload;
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      return undefined;
    }

    if ('result' in result) {
      const nestedResult = (result as { result?: unknown }).result;
      if (nestedResult && typeof nestedResult === 'object' && !Array.isArray(nestedResult)) {
        return nestedResult as Record<string, unknown>;
      }
    }

    return undefined;
  }

  private isChatFormattedResult(value: unknown): value is IChatFormattedResult {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }

    const candidate = value as Partial<IChatFormattedResult>;

    const { visualizationType, formattedData, summary } = candidate;

    if (!visualizationType || !VALID_VISUALIZATION_TYPES.has(visualizationType)) {
      return false;
    }

    if (formattedData !== null && !Array.isArray(formattedData)) {
      return false;
    }

    return typeof summary === 'string';
  }

  private async recordTokenUsage({
    usage,
    companyId,
    message,
    result,
  }: {
    usage?: AgentGenerateResult['totalUsage'];
    companyId: string;
    message: string;
    result: IChatFormattedResult;
  }): Promise<void> {
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
}
