import { Inject, Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../../ai/services/gemini.service';
import { AIChatResponse, ChatMessage, QueryContext } from '../interfaces/chat.interface';
import { DatabaseSchemaService } from './database-schema.service';
import { DynamicSQLService } from './dynamic-sql.service';
import { McpClientService } from './mcp-client.service';
import { MessageService } from './message.service';
import { SessionService } from './session.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  constructor(
    @Inject(SessionService) private readonly sessionService: SessionService,
    @Inject(MessageService) private readonly messageService: MessageService,
    @Inject(DynamicSQLService) private readonly dynamicSQLService: DynamicSQLService,
    @Inject(GeminiService) private readonly geminiService: GeminiService,
    @Inject(DatabaseSchemaService) private readonly databaseSchemaService: DatabaseSchemaService,
    @Inject(McpClientService) private readonly mcpClientService: McpClientService
  ) {
    this.logger.log('ChatService constructor called - dependencies restored');
  }
  async processUserMessage(
    sessionId: string,
    message: string,
    userId: string,
    userContext: Partial<QueryContext>
  ): Promise<AIChatResponse> {
    try {
      this.logger.log(
        `Processing user message: "${message}" for user ${userId} in session ${sessionId}`
      );

      // Create user message
      await this.messageService.createMessage(sessionId, message, 'user', userId);
      this.logger.log('User message created successfully');

      // Update session activity
      await this.sessionService.updateLastActivity(sessionId);
      this.logger.log('Session activity updated');

      // Get session history for context
      const sessionHistory = await this.messageService.getSessionMessages(sessionId, 10);
      this.logger.log(`Retrieved ${sessionHistory.length} session history messages`);

      // Get dynamic table list from schema service
      const schema = await this.databaseSchemaService.getDatabaseSchema();

      // Build full context
      const context: QueryContext = {
        userId,
        userRole: userContext.userRole || 'user',
        branchId: userContext.branchId,
        sessionHistory,
        availableTables: schema.tables.map((table) => table.name),
        userPermissions: userContext.userPermissions || [],
      };
      this.logger.log(`Built context: role=${context.userRole}, branchId=${context.branchId}`); // Analyze message type and route to appropriate handler
      const requiresDatabase = await this.analyzeDatabaseRequirement(message, context);
      const requiresMcp = await this.analyzeMcpRequirement(message, context);

      this.logger.log(`Analysis: database=${requiresDatabase}, mcp=${requiresMcp}`);

      // Priority: MCP > Database > General
      if (requiresMcp) {
        this.logger.log('Handling as MCP-powered supply chain query');
        return await this.handleMcpQuery(message, context, sessionId, userId);
      }
      if (requiresDatabase) {
        this.logger.log('Handling as database query');
        return await this.handleDatabaseQuery(message, context, sessionId, userId);
      }
      this.logger.log('Handling as general query');
      return await this.handleGeneralQuery(message, context, sessionId, userId);
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
  private async analyzeDatabaseRequirement(
    message: string,
    _context: QueryContext
  ): Promise<boolean> {
    const lowerMessage = message.toLowerCase();

    // Keywords that typically indicate database queries
    const dbKeywords = [
      'show',
      'list',
      'find',
      'get',
      'search',
      'count',
      'total',
      'purchase request',
      'purchase order',
      'supplier',
      'item',
      'inventory',
      'stock',
      'order',
      'report',
      'summary',
      'how many',
      'what is',
      'when was',
      'who created',
    ];

    return dbKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  private async analyzeMcpRequirement(message: string, _context: QueryContext): Promise<boolean> {
    const lowerMessage = message.toLowerCase();

    // Keywords that indicate supply chain AI/workflow queries that should use MCP
    const mcpKeywords = [
      'supply chain',
      'analyze supply',
      'predict demand',
      'optimize inventory',
      'forecast',
      'supply risk',
      'vendor performance',
      'lead time',
      'reorder point',
      'safety stock',
      'ai analysis',
      'ai insight',
      'recommend',
      'suggest',
      'workflow',
      'automation',
      'smart',
      'intelligent',
    ];

    return mcpKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  private async handleMcpQuery(
    message: string,
    context: QueryContext,
    sessionId: string,
    userId: string
  ): Promise<AIChatResponse> {
    try {
      this.logger.log(`🤖 Handling MCP-powered supply chain query: "${message}"`);

      // Check MCP client health
      const mcpHealth = await this.mcpClientService.healthCheck();
      if (!mcpHealth.connected) {
        this.logger.warn('MCP client not connected, falling back to regular AI query');
        return await this.handleGeneralQuery(message, context, sessionId, userId);
      }

      this.logger.log(
        `🔗 MCP connected with ${mcpHealth.toolsCount} tools: ${mcpHealth.availableTools.join(', ')}`
      );

      // Execute MCP query or workflow
      const response = await this.executeMcpRequest(message, context);

      // Process response and create chat response
      const chatResponse = await this.processMcpResponse(response, message, sessionId);

      this.logger.log('✅ MCP query processed successfully');
      return chatResponse;
    } catch (error) {
      this.logger.error('❌ Failed to handle MCP query:', error);
      // Fallback to general query if MCP fails
      this.logger.log('🔄 Falling back to general AI query...');
      return await this.handleGeneralQuery(message, context, sessionId, userId);
    }
  }

  private async executeMcpRequest(message: string, context: QueryContext) {
    const isWorkflowQuery = this.isWorkflowQuery(message);

    if (isWorkflowQuery) {
      this.logger.log('🔄 Executing supply chain workflow via MCP...');
      const workflowInput = this.extractWorkflowInput(message, context);
      return await this.mcpClientService.executeSupplyChainWorkflow(workflowInput);
    }
    this.logger.log('🧠 Querying supply chain agent via MCP...');
    return await this.mcpClientService.querySupplyChainAgent(message, {
      userId: context.userId,
      userRole: context.userRole,
      branchId: context.branchId,
      sessionHistory: context.sessionHistory.slice(-5), // Last 5 messages for context
    });
  }

  private async processMcpResponse(
    response: {
      success: boolean;
      response?: string;
      result?: unknown;
      error?: string;
      toolsAvailable?: string[];
      [key: string]: unknown;
    },
    message: string,
    sessionId: string
  ): Promise<AIChatResponse> {
    const { responseMessage, suggestions } = this.buildMcpResponseMessage(response, message);
    const isWorkflowQuery = this.isWorkflowQuery(message);

    // Create assistant message
    await this.messageService.createMessage(sessionId, responseMessage, 'assistant', 'assistant', {
      type: 'mcp_response',
      mcpSuccess: response.success,
      toolsUsed: response.toolsAvailable || [],
      workflowExecuted: isWorkflowQuery,
    });

    return {
      message: responseMessage,
      type: 'text',
      sessionId,
      timestamp: new Date().toISOString(),
      suggestions,
      metadata: {
        mcpPowered: true,
        toolsUsed: response.toolsAvailable || [],
        workflowExecuted: isWorkflowQuery,
      },
    };
  }

  private buildMcpResponseMessage(
    response: {
      success: boolean;
      response?: string;
      result?: unknown;
      error?: string;
      toolsAvailable?: string[];
      [key: string]: unknown;
    },
    message: string
  ): { responseMessage: string; suggestions: string[] } {
    let responseMessage = '';
    let suggestions: string[] = [];

    if (response.success) {
      responseMessage =
        (response.response as string) ||
        String(response.result) ||
        'Supply chain analysis completed successfully.';

      // Add contextual information
      if (response.toolsAvailable && response.toolsAvailable.length > 0) {
        responseMessage += `\n\n🔧 Available tools: ${response.toolsAvailable.join(', ')}`;
      }

      // Generate suggestions based on the MCP response
      suggestions = this.generateMcpSuggestions(message, response);
    } else {
      responseMessage = `I encountered an issue with the supply chain analysis: ${response.error || 'Unknown error'}`;

      if (response.toolsAvailable && response.toolsAvailable.length > 0) {
        responseMessage += `\n\nAvailable tools: ${response.toolsAvailable.join(', ')}`;
      }
    }

    return { responseMessage, suggestions };
  }

  private async handleDatabaseQuery(
    message: string,
    context: QueryContext,
    sessionId: string,
    userId: string
  ): Promise<AIChatResponse> {
    try {
      this.logger.log(`Handling database query: "${message}"`);

      console.log('\n🔀 ===== SIMPLIFIED QUERY ROUTING =====');
      console.log('📝 Query:', message);
      console.log('🤖 Using: DynamicSQLService (AI-powered) - ALWAYS');
      console.log('✅ Predefined queries removed - Pure LLM approach');

      // Always use dynamic SQL service for LLM-powered queries
      this.logger.log('Using dynamic SQL service (LLM-powered)');
      return await this.handleDynamicSQLQuery(message, context, sessionId, userId);
    } catch (error) {
      this.logger.error('Failed to handle database query:', error);
      this.logger.error('Error stack:', error.stack);
      const errorMessage =
        'I encountered an error while querying the database. Please try rephrasing your question.';

      await this.messageService.createMessage(sessionId, errorMessage, 'error', 'assistant');

      return {
        message: errorMessage,
        type: 'error',
        sessionId,
        timestamp: new Date().toISOString(),
      };
    }
  }
  private async handleGeneralQuery(
    message: string,
    context: QueryContext,
    sessionId: string,
    _userId: string
  ): Promise<AIChatResponse> {
    try {
      // Build context for the AI
      const systemPrompt = this.buildSystemPrompt(context);
      const conversationHistory = this.buildConversationHistory(context.sessionHistory); // Get AI response using Gemini
      const aiResponse = await this.geminiService.generateText(
        `${systemPrompt}\n\nConversation History:\n${conversationHistory}\n\nUser: ${message}\n\nAssistant:`
      );

      // Store assistant response
      await this.messageService.createMessage(sessionId, aiResponse, 'assistant', 'assistant', {
        isGeneralQuery: true,
        executionTime: Date.now(),
      });

      return {
        message: aiResponse,
        type: 'text',
        suggestions: this.generateSuggestions(message),
      };
    } catch (error) {
      this.logger.error('Failed to handle general query:', error);

      const errorMessage =
        'I apologize, but I cannot provide a response right now. Please try again later.';

      await this.messageService.createMessage(sessionId, errorMessage, 'error', 'assistant');

      return {
        message: errorMessage,
        type: 'error',
      };
    }
  }
  private async generateDataResponse(
    originalQuery: string,
    data: unknown,
    explanation: string,
    _context: QueryContext
  ): Promise<AIChatResponse> {
    try {
      // Format the data for AI analysis
      const dataString = JSON.stringify(data, null, 2);

      const prompt = `
You are a SupplySense AI assistant. A user asked: "${originalQuery}"

I've retrieved the following data from the database: ${explanation}

Data:
${dataString}

Please provide a helpful, conversational response that:
1. Directly answers the user's question
2. Summarizes the key insights from the data
3. Highlights any notable patterns or issues
4. Suggests actionable next steps if relevant
5. Keep the response concise but informative

Response:`;

      const aiResponse = await this.geminiService.generateText(prompt);

      return {
        message: aiResponse,
        type: 'data',
        data: data,
        suggestions: this.generateDataSuggestions(originalQuery, data),
        metadata: {
          dataType: typeof data,
          recordCount: Array.isArray(data) ? data.length : 1,
        },
      };
    } catch (error) {
      this.logger.error('Failed to generate data response:', error);

      // Fallback to basic data presentation
      return {
        message: `Here's the data for your query: ${explanation}`,
        type: 'data',
        data: data,
      };
    }
  }

  private buildSystemPrompt(context: QueryContext): string {
    return `
You are an AI assistant for SupplySense, a supply chain management system. You help users understand their supply chain data, processes, and provide insights.

Context:
- User Role: ${context.userRole}
- Branch ID: ${context.branchId || 'Not specified'}
- Available capabilities: Purchase requests, purchase orders, inventory management, supplier management

Guidelines:
- Be helpful and professional
- Provide actionable insights when possible
- If you need to access database information, suggest specific queries
- Always consider the user's role and permissions
- Focus on supply chain best practices and efficiency
`;
  }

  private buildConversationHistory(messages: ChatMessage[]): string {
    return messages
      .slice(-5) // Last 5 messages for context
      .map((msg) => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');
  }

  private generateSuggestions(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const suggestions: string[] = [];

    if (lowerMessage.includes('purchase request')) {
      suggestions.push(
        'Show me recent purchase requests',
        'What are pending purchase requests?',
        'Create a new purchase request'
      );
    }

    if (lowerMessage.includes('supplier')) {
      suggestions.push(
        'List all suppliers',
        'Show supplier performance',
        'Find suppliers for specific items'
      );
    }

    if (lowerMessage.includes('inventory') || lowerMessage.includes('stock')) {
      suggestions.push(
        'Check current stock levels',
        'Show low stock items',
        'Generate inventory report'
      );
    }

    // Default suggestions if none match
    if (suggestions.length === 0) {
      suggestions.push(
        'Show me dashboard summary',
        'What are my recent activities?',
        'Help me with purchase requests'
      );
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  private generateDataSuggestions(_query: string, data: unknown): string[] {
    const suggestions: string[] = [];

    if (Array.isArray(data) && data.length > 0) {
      suggestions.push(
        'Tell me more about the first item',
        'Show me a summary of this data',
        'What patterns do you see here?'
      );
    }

    return suggestions;
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

  /**
   * Handle complex queries using dynamic SQL generation (ALWAYS USED NOW)
   */ private async handleDynamicSQLQuery(
    message: string,
    context: QueryContext,
    sessionId: string,
    userId: string
  ): Promise<AIChatResponse> {
    try {
      this.logger.log('Starting dynamic SQL query processing');
      this.logger.log(
        `User context: ${JSON.stringify({ userId, branchId: context.branchId, userRole: context.userRole })}`
      );

      // Use dynamic SQL service for complex natural language queries
      const result = await this.dynamicSQLService.generateSQLFromNaturalLanguage(message, {
        userId,
        branchId: context.branchId,
        userRole: context.userRole,
      });
      this.logger.log(`Dynamic SQL result received: ${result.result.length} records`);
      if (result.sql) {
        this.logger.log('🔧 Generated SQL Query:');
        this.logger.log(result.sql);
      }

      // Store assistant response
      await this.messageService.createMessage(
        sessionId,
        result.explanation,
        'assistant',
        'assistant',
        {
          queryType: 'DYNAMIC_SQL',
          dataIncluded: true,
          resultCount: result.result.length,
          sqlQuery: result.sql,
          executionTime: Date.now(),
        }
      );
      return {
        message: result.explanation,
        type: 'data',
        sessionId,
        timestamp: new Date().toISOString(),
        data: result.result,
        sqlQuery: result.sql, // Include the generated SQL query
        metadata: {
          resultCount: result.result.length,
          queryType: 'DYNAMIC_SQL',
          sqlExecuted: !!result.sql,
        },
      };
    } catch (error) {
      this.logger.error('Failed to execute dynamic SQL query:', error);
      this.logger.error('Error details:', error.message);
      this.logger.error('Error stack:', error.stack);

      // Create error message for user
      const errorMessage =
        'I encountered an error while processing your query. Please try rephrasing your question or ask something else.';

      await this.messageService.createMessage(sessionId, errorMessage, 'error', 'assistant');
      return {
        message: errorMessage,
        type: 'error',
        sessionId,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get MCP client health status for API endpoints
   */
  async getMcpHealth() {
    try {
      const mcpHealth = await this.mcpClientService.healthCheck();
      const connectionStatus = this.mcpClientService.getConnectionStatus();

      return {
        status: mcpHealth.connected ? 'healthy' : 'disconnected',
        timestamp: new Date().toISOString(),
        mcp: {
          connected: mcpHealth.connected,
          toolsCount: mcpHealth.toolsCount,
          availableTools: mcpHealth.availableTools,
          hasClient: connectionStatus.hasClient,
          error: mcpHealth.error,
        },
        server: {
          name: 'SupplySense Supply Chain Server',
          capabilities: [
            'Supply Chain Agent (ask_supplyChainAgent)',
            'Supply Chain Workflow (run_supplyChainWorkflow)',
            'Supply Chain Status Tool',
          ],
        },
      };
    } catch (error) {
      this.logger.error('Failed to get MCP health:', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        mcp: {
          connected: false,
          toolsCount: 0,
          availableTools: [],
          hasClient: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        server: {
          name: 'SupplySense Supply Chain Server',
          capabilities: [],
        },
      };
    }
  }

  /**
   * Test MCP integration without authentication
   */
  async testMcpIntegration(query: string) {
    try {
      this.logger.log(`Testing MCP integration with query: "${query}"`);
      this.logger.log(`McpClientService available: ${!!this.mcpClientService}`);

      if (!this.mcpClientService) {
        throw new Error('McpClientService is not available');
      }

      this.logger.log(
        `McpClientService querySupplyChainAgent method: ${typeof this.mcpClientService.querySupplyChainAgent}`
      );

      // Try to execute the supply chain agent query
      const result = await this.mcpClientService.querySupplyChainAgent(query, {
        testMode: true,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        query,
        mcpResult: result,
        timestamp: new Date().toISOString(),
        message: 'MCP integration test completed successfully',
      };
    } catch (error) {
      this.logger.error('MCP integration test failed:', error);
      return {
        success: false,
        query,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        message: 'MCP integration test failed',
      };
    }
  }

  /**
   * Test MCP workflow integration without authentication
   */
  async testMcpWorkflow(workflowInput: Record<string, unknown>) {
    try {
      this.logger.log(`Testing MCP workflow with input: ${JSON.stringify(workflowInput)}`);

      // Try to execute the supply chain workflow
      const result = await this.mcpClientService.executeSupplyChainWorkflow(workflowInput);

      return {
        success: true,
        workflowInput,
        mcpResult: result,
        timestamp: new Date().toISOString(),
        message: 'MCP workflow test completed successfully',
      };
    } catch (error) {
      this.logger.error('MCP workflow test failed:', error);
      return {
        success: false,
        workflowInput,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        message: 'MCP workflow test failed',
      };
    }
  }
}
