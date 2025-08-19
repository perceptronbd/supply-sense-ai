## Chat Controller
```ts
class ChatController {
  constructor(private chatService: ChatService) {}
  
  // Creates new chat session
  async createSession(createSessionDto: CreateSessionDto): Promise<Session>
  
  // Gets all sessions for a user
  async getUserSessions(userId: string, limit?: number, offset?: number): Promise<Session[]>
  
  // Gets specific session
  async getSession(sessionId: string): Promise<Session>
  
  // Processes user message and returns AI response
  async processMessage(sessionId: string, processMessageDto: ProcessMessageDto): Promise<AIChatResponse>
  
  // Gets messages for a session
  async getSessionMessages(sessionId: string, limit?: number, offset?: number): Promise<Message[]>
  
  // Deletes a session
  async deleteSession(sessionId: string): Promise<void>
}
```

# Chat Service
```ts
class ChatService {
  constructor(
    private prisma: PrismaService,
    private mcpClientService: McpClientService,
    private conversationService: ConversationService,
    private sessionService: SessionService,
    private messageService: MessageService
  ) {}
  
  // Main method to process user messages
  async processUserMessage(params: ProcessMessageParams): Promise<AIChatResponse>
    // Validates session and database connection
    // Builds minimal system message (NO schema)
    // Gets conversation context
    // Calls MCP agent with optimized context
    // Stores messages and updates conversation state
    // Returns formatted response
  
  // Creates new chat session
  async createSession(createSessionDto: CreateSessionDto): Promise<Session>
  
  // Gets session with validation
  async getSession(sessionId: string, userId?: string): Promise<Session>
  
  // Gets user sessions
  async getUserSessions(userId: string, limit?: number, offset?: number): Promise<Session[]>
  
  // Deletes session and related data
  async deleteSession(sessionId: string, userId?: string): Promise<void>
  
  // Gets session messages
  async getSessionMessages(sessionId: string, limit?: number, offset?: number): Promise<Message[]>
  
  // Builds minimal system message (token optimized)
  private buildSystemMessage(params: SystemMessageParams): string
    // Includes session context, user context
    // Excludes database schema (handled by tools)
    // Lists available tools and their purposes
  
  // Initializes chat agent
  private async initializeChatAgent(): Promise<void>
    // Creates Mastra agent with instructions
    // Loads tools from MCP client
    // Sets up streaming capabilities
}
```

## Conversation Service
```ts
class ConversationService {
  constructor(private prisma: PrismaService) {}
  
  // Updates conversation context after each message
  async updateConversationContext(params: UpdateContextParams): Promise<ConversationState>
    // Gets current conversation state
    // Uses conversation agent to analyze exchange
    // Extracts entities, topics, sentiment
    // Updates database with new context
  
  // Gets conversation state for session
  async getConversationState(sessionId: string): Promise<ConversationState>
  
  // Gets conversation history
  async getConversationHistory(sessionId: string, limit?: number): Promise<Message[]>
  
  // Initializes conversation agent for analysis
  private async initializeConversationAgent(): Promise<void>
    // Creates specialized agent for conversation analysis
    // Sets up instructions for context extraction
}
```

## Session Service
```ts
class SessionService {
  constructor(private prisma: PrismaService) {}
  
  // Creates new chat session
  async createSession(createSessionDto: CreateSessionDto): Promise<Session>
  
  // Gets session with user validation
  async getSession(sessionId: string, userId?: string): Promise<Session>
  
  // Gets user's sessions
  async getUserSessions(userId: string, limit?: number, offset?: number): Promise<Session[]>
  
  // Updates session last activity
  async updateLastActivity(sessionId: string): Promise<void>
  
  // Deletes session
  async deleteSession(sessionId: string, userId?: string): Promise<void>
}
```
***NOTE****: A controller for session is required as well.*

# Mastra MCP

## Tools
```ts
// tools/analyze-query.tool.ts
class AnalyzeQueryTool {
  // Creates tool definition
  static create(): Tool
    // Configures tool schema and description
    // Sets up execution logic
    // Returns Mastra tool object
  
  // Tool execution logic
  static async execute(params: AnalyzeQueryParams): Promise<QueryAnalysisResult>
    // Uses query analysis agent to understand user question
    // Identifies required tables and data needs
    // Estimates query complexity
    // Returns structured analysis plan
}

// tools/generate-query.tool.ts
class GenerateQueryTool {
  // Creates tool definition
  static create(): Tool
    // Configures tool for SQL generation
    // Sets up schema access capabilities
    // Returns Mastra tool object
  
  // Tool execution logic
  static async execute(params: GenerateQueryParams): Promise<QueryGenerationResult>
    // Gets schema service instance
    // Loads schema for required tables only (token optimized)
    // Uses SQL generation agent to create query
    // Returns SQL query with parameters
}
```

```ts
// tools/execute-query.tool.ts
class ExecuteQueryTool {
  // Creates tool definition
  static create(): Tool
    // Configures tool for query execution
    // Sets up database connection management
    // Returns Mastra tool object
  
  // Tool execution logic
  static async execute(params: ExecuteQueryParams): Promise<QueryExecutionResult>
    // Gets database connection for connectionId
    // Executes SQL query with parameters
    // Handles errors and timeouts
    // Returns query results and metadata
}

// tools/format-results.tool.ts
class FormatResultsTool {
  // Creates tool definition
  static create(): Tool
    // Configures tool for result formatting
    // Sets up multiple format options
    // Returns Mastra tool object
  
  // Tool execution logic
  static async execute(params: FormatResultsParams): Promise<FormatResult>
    // Uses formatting agent to process results
    // Generates natural language explanations
    // Creates visualizations if requested
    // Returns formatted response
}
```

## Agents
```ts
// agents/query-analysis.agent.ts
class QueryAnalysisAgent {
  // Creates specialized agent for query analysis
  static create(): Agent
    // Configures agent with analysis instructions
    // Sets up model and tools
    // Returns Mastra agent instance
  
  // Analyzes user question
  static async analyze(question: string, context: AnalysisContext): Promise<QueryAnalysis>
    // Understands user intent
    // Identifies required data
    // Estimates complexity
    // Returns analysis plan
}

// agents/sql-generation.agent.ts
class SQLGenerationAgent {
  // Creates specialized agent for SQL generation
  static create(): Agent
    // Configures agent with SQL expertise
    // Sets up model and schema access
    // Returns Mastra agent instance
  
  // Generates SQL from analysis
  static async generateSQL(params: SQLGenerationParams): Promise<SQLQuery>
    // Uses analysis plan and schema
    // Generates optimized SQL
    // Includes parameterization
    // Returns SQL query
}

// agents/formatting.agent.ts
class FormattingAgent {
  // Creates specialized agent for result formatting
  static create(): Agent
    // Configures agent with formatting instructions
    // Sets up multiple output formats
    // Returns Mastra agent instance
  
  // Formats query results
  static async formatResults(params: FormatParams): Promise<FormattedResponse>
    // Processes raw query results
    // Generates natural language explanations
    // Creates visualizations if needed
    // Returns formatted response
}
```