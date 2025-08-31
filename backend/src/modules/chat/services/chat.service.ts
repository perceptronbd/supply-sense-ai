import { Agent } from '@mastra/core/agent';
import { McpClientService } from '@modules/mcp-client/services/mcp-client.service';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { PrismaService } from '@supplysense/prisma';
import { GetOpenRouter } from '@supplysense/utils';
import { AIChatResponse, QueryContext } from '../interfaces/chat.interface';
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
        description:
          'An intelligent AI assistant powered by SupplySense that specializes in supply chain analytics, inventory optimization, logistics planning, procurement insights, and database-driven decision making for enterprise supply chain operations',
        instructions:
          'You are a supply chain AI assistant, called SupplySense. Use the available tools to help with supply chain queries, inventory management, and logistics operations.',
        model: this.openrouter.getModel(AI_MODEL_NAMES.Z_AI),
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
      const toolsets = await mcpClient.getToolsets();

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

        You MUST follow this workflow:
        1. First, use the query-analysis-tool with these parameters:
           - dbConnectionId: "${dbConnectionId}"
           - userQuery: The user's message/question "${message}"
        
        2. After getting the analysis, use the execute-query-tool with these parameters:
           - dbConnectionId: "${dbConnectionId}"
           - queryAnalysis: The analysis result from step 1
           - userQuery: The user's original message "${message}" (for better formatting context)
        
        The execute-query-tool will now handle formatting internally and return:
        - sqlQuery: The generated SQL query
        - queryResults: The raw database results
        - visualizationType: The recommended display format
        - formattedData: Chart.js compatible data structure or table data
        - summary: Brief description of the data
        
        TOOLS AVAILABLE:
        - query-analysis-tool: Analyzes user queries and extracts insights about intent and requirements
        - execute-query-tool: Generates and executes SQL queries, then formats results for optimal visualization
        
        CRITICAL: You must ALWAYS return your final response in a structured JSON format containing:
        {
          "visualizationType": "table|bar|pie|line|doughnut|text",
          "formattedData": [...], // Array of objects for table data (preserving original query structure), or Chart.js format for charts
          "summary": "Brief description",
          "message": "Your explanatory text here",
          "sqlQuery": "The SQL query that was executed",
          "queryResults": [...] // The raw database results
        }
        
        For table visualizations, the formattedData should be an array of objects that preserves the original database query results without transformation. This allows the frontend to handle any data structure flexibly.
        
        Always provide helpful responses explaining the data insights and visualization recommendations.`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        {
          toolsets,
        }
      );

      // this.logger.log(toolsets)

      const aiResponse = agentResponse.text || 'I apologize, but I could not process your request.';
      this.logger.log('AI response generated successfully', aiResponse);

      // Try to parse the structured JSON response from the agent
      let parsedResponse: {
        visualizationType?: 'text' | 'table' | 'bar' | 'pie' | 'line' | 'doughnut';
        formattedData?: unknown;
        summary?: string;
        message?: string;
        sqlQuery?: string;
        queryResults?: unknown[];
      } = {};

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

      // Determine the response type and data
      let responseType: 'table' | 'text' | 'data' | 'error' | 'bar' | 'pie' | 'line' | 'doughnut' =
        'data';

      if (parsedResponse.visualizationType) {
        // Map visualization types to response types
        switch (parsedResponse.visualizationType) {
          case 'table':
            responseType = 'table';
            break;
          case 'bar':
          case 'pie':
          case 'line':
          case 'doughnut':
            responseType = parsedResponse.visualizationType;
            break;
          case 'text':
            responseType = 'text';
            break;
          default:
            responseType = 'data';
        }
      }

      this.logger.debug('Determined parsedResponse:', parsedResponse);

      const responseMessage = parsedResponse.message || aiResponse;
      const responseData = parsedResponse.formattedData;

      // Create assistant message
      await this.messageService.createMessage(sessionId, responseMessage, 'assistant');
      this.logger.log('Assistant message created successfully');

      return {
        message: responseMessage,
        type: responseType,
        data: responseData,
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
        'error'
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
