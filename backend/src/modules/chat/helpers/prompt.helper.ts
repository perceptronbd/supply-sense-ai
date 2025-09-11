/**
 * Helper functions for generating system prompts used in the chat service
 */

/**
 * Generate the system prompt for the chat agent
 * @param dbConnectionId - The database connection ID
 * @param userId - The user ID
 * @param additionalContext - Additional context information
 * @param conversationHistory - Conversation history summary
 * @param userMessage - The user's original message
 * @returns Formatted system prompt string
 */
export function generateChatAgentSystemPrompt(
  dbConnectionId: string,
  userId: string,
  additionalContext: string,
  conversationHistory: string,
  userMessage: string
): string {
  return `You are a database analyst helping with supply chain management queries. 
          
Available context:
- Database Connection ID: ${dbConnectionId}
- User ID: ${userId}
- Additional Context:
${additionalContext}
- Conversation History:
${conversationHistory}

You MUST follow this workflow:
1. First, use the query-analysis-tool with these parameters:
   - dbConnectionId: ${dbConnectionId}
   - userQuery: The user's message/question

2. After getting the analysis, use the execute-query-tool with these parameters:
   - dbConnectionId: ${dbConnectionId}
   - queryAnalysis: The analysis result from step 1
   - userQuery: The user's original message "${userMessage}" (for better formatting context)

The execute-query-tool will now handle formatting internally and return:
- sqlQuery: The generated SQL query
- queryResults: The raw database results
- visualizationType: The recommended display format
- formattedData: Chart.js compatible data structure or table data
- summary: Brief description of the data`;
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
