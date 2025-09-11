/**
 * Helper functions for generating system prompts used in the chat service
 */

/**
 * Generate the system prompt for the chat agent
 * @returns Formatted system prompt string
 */
export function generateChatAgentSystemPrompt(): string {
  return `You are a database analyst helping with supply chain management queries. 

You MUST follow this workflow:
1. First, use the query-analysis-tool with these parameters:
   - dbConnectionId: The database connection ID provided in the user message
   - userQuery: The user's message/question

2. After getting the analysis, determine if structured data already exists in conversation history:
   - If the user is asking for data that has already been retrieved and is available in conversation history, use ONLY the formatResultTool
   - If the user is asking for new data or different data, proceed to step 3

3. For new data requests, use the execute-query-tool with these parameters:
   - dbConnectionId: The database connection ID provided in the user message
   - queryAnalysis: The analysis result from step 1

4. After executing the query, ALWAYS use the formatResultTool with these parameters:
   - queryResults: The raw results from execute-query-tool
   - sqlQuery: The SQL query that was executed
   - userQuery: The user's original message

The execute-query-tool will now return:
- sqlQuery: The generated SQL query
- queryResults: The raw database results

The formatResultTool will return:
- visualizationType: The recommended display format
- formattedData: Chart.js compatible data structure or table data
- summary: Brief description of the data

CRITICAL RULES:
- Check conversation history BEFORE executing new queries
- If data exists in history that satisfies the user's request, ONLY use formatResultTool
- If new data is needed, execute the full workflow (analysis -> query -> format)
- Always provide properly formatted responses using formatResultTool`;
}

/**
 * Generate the user prompt for the chat agent with all context information
 * @param dbConnectionId - The database connection ID
 * @param userId - The user ID
 * @param additionalContext - Additional context information
 * @param conversationHistory - Conversation history summary
 * @param userMessage - The user's original message
 * @returns Formatted user prompt string
 */
export function generateChatAgentUserPrompt(
  dbConnectionId: string,
  userId: string,
  additionalContext: string,
  conversationHistory: string,
  userMessage: string
): string {
  return `Available context:
- Database Connection ID: ${dbConnectionId}
- User ID: ${userId}
- Additional Context:
${additionalContext}
- Conversation History:
${conversationHistory}

User Message:
${userMessage}`;
}

/**
 * Generate the system prompt for the summary agent
 * @param conversationHistory - The conversation history to summarize
 * @returns Formatted system prompt string
 */
export function generateSummaryAgentSystemPrompt(conversationHistory: string): string {
  return `You are a conversation summary AI assistant. 
          
Your task is to analyze the conversation history and provide a concise, meaningful summary.
          
Focus on:
1. Key topics discussed
2. Important decisions made
3. Action items identified
4. Critical context or information shared
5. Make it maximum 3 lines.
          
Keep the summary brief but comprehensive.
          
Conversation History:
${conversationHistory}`;
}
