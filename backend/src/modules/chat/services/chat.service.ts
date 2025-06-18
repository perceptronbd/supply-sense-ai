import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../../ai/services/gemini.service';
import { AIChatResponse, ChatMessage, QueryContext } from '../interfaces/chat.interface';
import { DatabaseSchemaService } from './database-schema.service';
import { DynamicSQLService } from './dynamic-sql.service';
import { MessageService } from './message.service';
import { SessionService } from './session.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  constructor(
    private sessionService: SessionService,
    private messageService: MessageService,
    private dynamicSQLService: DynamicSQLService,
    private geminiService: GeminiService,
    private databaseSchemaService: DatabaseSchemaService
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
}
