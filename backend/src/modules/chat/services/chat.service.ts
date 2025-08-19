import { PrismaService } from '@/app/prisma.service';
import { Agent } from '@mastra/core/agent';
import { McpClientService } from '@modules/mcp-client/services/mcp-client.service';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { GetOpenRouter } from '@supplysense/utils';
import { AIChatResponse, QueryContext } from '../interfaces/chat.interface';
import { DatabaseSchemaService } from './database-schema.service';
import { DynamicSQLService } from './dynamic-sql.service';
import { MessageService } from './message.service';
import { SessionService } from './session.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private chatAgent: Agent | null = null;
  private readonly openrouter = new GetOpenRouter();

  constructor(
    @Inject(SessionService) private readonly sessionService: SessionService,
    @Inject(MessageService) private readonly messageService: MessageService,
    @Inject(DynamicSQLService)
    private readonly dynamicSQLService: DynamicSQLService,
    @Inject(DatabaseSchemaService)
    private readonly databaseSchemaService: DatabaseSchemaService,
    @Inject(McpClientService)
    private readonly mcpClientService: McpClientService,
    @Inject(PrismaService)
    private readonly prismaService: PrismaService
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
        description: 'AI assistant specialized in supply chain management and logistics',
        instructions:
          'You are a supply chain AI assistant, called SupplySense. Use the available tools to help with supply chain queries, inventory management, and logistics operations.',
        model: this.openrouter.getModel(),
        tools,
      });
      this.logger.log('✅ Table metadata agent initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize table metadata agent:', error);
      throw error;
    }
  }

  async processUserMessage({
    sessionId,
    message,
    userId,
    dbConnectionId = '',
    userContext,
  }: {
    sessionId: string;
    message: string;
    userId: string;
    dbConnectionId: string;
    userContext: Partial<QueryContext>;
  }): Promise<AIChatResponse> {
    try {
      await this.initializeChatAgent();
      if (!this.chatAgent) {
        throw new Error('Chat agent not initialized');
      }

      this.logger.log(
        `Processing user message: "${message}" for user ${userId} in session ${sessionId}`
      );

      // Create user message
      // await this.messageService.createMessage(sessionId, message, 'user', userId);
      // this.logger.log('User message created successfully');

      // Update session activity
      await this.sessionService.updateLastActivity(sessionId);
      this.logger.log('Session activity updated');

      // Get session history for context
      const sessionHistory = await this.messageService.getSessionMessages(sessionId, 10);
      this.logger.log(`Retrieved ${sessionHistory.length} session history messages`);

      // Prepare context for the AI agent
      const conversationHistory = sessionHistory
        .map((msg) => `${msg.type}: ${msg.content}`)
        .join('\n');

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
      const mcpClient = this.mcpClientService.getMcpClient();
      // Use the chat agent to process the message
      const agentResponse = await this.chatAgent.generate(
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
        ${conversationHistory}

        Use the database-query-tool when the user asks questions about data, analytics, or wants to query the database.
        Always provide helpful, accurate responses and explain your reasoning.`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        {
          toolsets: await mcpClient.getToolsets(),
        }
      );

      const aiResponse = agentResponse.text || 'I apologize, but I could not process your request.';
      this.logger.log('AI response generated successfully', aiResponse);
      // Create assistant message
      await this.messageService.createMessage(sessionId, aiResponse, 'assistant', 'assistant');
      this.logger.log('Assistant message created successfully');

      return {
        message: aiResponse,
        type: 'data',
        sessionId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to process user message:', error);
      this.logger.error('Error stack:', error.stack);

      // Create error message
      await this.messageService.createMessage(
        sessionId,
        'I apologize, but I encountered an error processing your request. Please try again.',
        'error',
        'assistant'
      );

      return {
        message:
          'I apologize, but I encountered an error processing your request. Please try again.',
        type: 'error',
        sessionId,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async createSession(title: string, userId: string, description?: string) {
    return this.sessionService.createSession(title, userId, description);
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
