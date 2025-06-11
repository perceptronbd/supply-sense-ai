import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../../ai/services/gemini.service';
import { AIChatResponse, ChatMessage, QueryContext } from '../interfaces/chat.interface';
import { DatabaseQueryService } from './database-query.service';
import { DynamicSQLService } from './dynamic-sql.service';
import { MessageService } from './message.service';
import { SessionService } from './session.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  constructor(
    private sessionService: SessionService,
    private messageService: MessageService,
    private databaseQueryService: DatabaseQueryService,
    private dynamicSQLService: DynamicSQLService,
    private geminiService: GeminiService
  ) {}
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

      // Build full context
      const context: QueryContext = {
        userId,
        userRole: userContext.userRole || 'user',
        branchId: userContext.branchId,
        sessionHistory,
        availableTables: this.getAvailableTables(),
        userPermissions: userContext.userPermissions || [],
      };
      this.logger.log(`Built context: role=${context.userRole}, branchId=${context.branchId}`);

      // Analyze if the message requires database access
      const requiresDatabase = await this.analyzeDatabaseRequirement(message, context);
      this.logger.log(`Database requirement analysis: ${requiresDatabase}`);

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
  private async handleDatabaseQuery(
    message: string,
    context: QueryContext,
    sessionId: string,
    userId: string
  ): Promise<AIChatResponse> {
    try {
      this.logger.log(`Handling database query: "${message}"`);

      // Check if this is a complex query that should use dynamic SQL
      const shouldUseDynamicSQL = this.shouldUseDynamicSQL(message);
      this.logger.log(`Should use dynamic SQL: ${shouldUseDynamicSQL}`);

      if (shouldUseDynamicSQL) {
        this.logger.log('Using dynamic SQL service');
        return await this.handleDynamicSQLQuery(message, context, sessionId, userId);
      }

      // Fall back to predefined database queries
      this.logger.log('Using predefined query service');
      return await this.handlePredefinedQuery(message, context, sessionId, userId);
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
You are a supply chain AI assistant. A user asked: "${originalQuery}"

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
You are an AI assistant for a supply chain management system. You help users understand their supply chain data, processes, and provide insights.

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

  private getAvailableTables(): string[] {
    return [
      'purchase_requests',
      'purchase_orders',
      'items',
      'suppliers',
      'branches',
      'users',
      'goods_receipts',
    ];
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
   * Determine if a query should use dynamic SQL generation
   */
  private shouldUseDynamicSQL(message: string): boolean {
    const lowerMessage = message.toLowerCase(); // Use dynamic SQL for complex analytical queries
    const dynamicSQLIndicators = [
      'stock below',
      'inventory below',
      'quantity less than',
      'quantity under',
      'compare',
      'analysis',
      'trend',
      'pattern',
      'correlation',
      'join',
      'group by',
      'order by',
      'aggregate',
      'sum',
      'count',
      'average',
      'between',
      'range',
      'filter by',
      'where',
      'br002',
      'branch code',
      'specific branch',
      'custom query',
      'complex query',
      'detailed report',
      'last 30 days',
      'in the last',
      'created in',
      'total amounts',
      'with their',
      'performance',
    ];

    // Use predefined queries for simple requests
    const predefinedIndicators = [
      'purchase requests',
      'purchase orders',
      'suppliers list',
      'items list',
      'basic inventory',
      'simple report',
    ];

    // Check for dynamic SQL indicators first
    const hasDynamicIndicators = dynamicSQLIndicators.some((indicator) =>
      lowerMessage.includes(indicator)
    );

    // Check for predefined indicators
    const hasPredefinedIndicators = predefinedIndicators.some((indicator) =>
      lowerMessage.includes(indicator)
    );

    // Default to dynamic SQL for complex queries, predefined for simple ones
    if (hasPredefinedIndicators && !hasDynamicIndicators) {
      return false;
    }

    return hasDynamicIndicators || lowerMessage.length > 50; // Complex queries tend to be longer
  }

  /**
   * Handle complex queries using dynamic SQL generation
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

      // Try falling back to predefined queries if dynamic SQL fails
      this.logger.warn('Falling back to predefined query handling...');
      return await this.handlePredefinedQuery(message, context, sessionId, userId);
    }
  }

  /**
   * Handle predefined database queries using the original service
   */
  private async handlePredefinedQuery(
    message: string,
    context: QueryContext,
    sessionId: string,
    _userId: string
  ): Promise<AIChatResponse> {
    try {
      // Interpret the natural language query
      const queryAnalysis = await this.databaseQueryService.interpretQuery(message, context);

      if (!queryAnalysis.canExecute) {
        const errorMessage = `I cannot execute this query: ${queryAnalysis.explanation}`;

        await this.messageService.createMessage(sessionId, errorMessage, 'assistant', 'assistant');
        return {
          message: errorMessage,
          type: 'error',
          sessionId,
          timestamp: new Date().toISOString(),
          metadata: {
            risks: queryAnalysis.risks,
          },
        };
      }

      // Execute the safe query
      const queryResult = await this.databaseQueryService.executeQuery(
        queryAnalysis.queryType,
        queryAnalysis.parameters,
        context
      );

      // Generate AI response based on the data
      const aiResponse = await this.generateDataResponse(
        message,
        queryResult,
        queryAnalysis.explanation,
        context
      );

      // Store assistant response
      await this.messageService.createMessage(
        sessionId,
        aiResponse.message,
        'assistant',
        'assistant',
        {
          queryType: queryAnalysis.queryType,
          dataIncluded: true,
          executionTime: Date.now(),
        }
      );
      return {
        ...aiResponse,
        sessionId,
        timestamp: new Date().toISOString(),
        databaseQuery: `${queryAnalysis.queryType}: ${queryAnalysis.explanation}`, // Include predefined query info
      };
    } catch (error) {
      this.logger.error('Failed to handle predefined query:', error);
      throw error; // Re-throw to be caught by parent handler
    }
  }
}
