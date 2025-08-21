//@ts-nocheck

import { createTool } from '@mastra/core/tools';
// import { PrismaClient } from '@prisma/client';
import { GetOpenRouter } from '@supplysense/utils';
import { z } from 'zod';

// const prisma = new PrismaClient();
const openrouter = new GetOpenRouter();

interface SQLQueryResult {
  sql: string | null;
  values: unknown[];
  explanation: string;
}

interface ParsedAIResponse {
  sql: string | null;
  values: unknown[];
  explanation: string;
}

interface QueryExecutionResult {
  success: boolean;
  data?: Record<string, unknown>[];
  error?: string;
  rowCount?: number;
  executionTime?: number;
}

interface DbConnectionInfo {
  id: string;
  title: string | null;
  database: string;
  host: string;
  businessContext?: string | null;
}

interface SchemaTable {
  name: string;
  columns?: Array<{
    name: string;
    type: string;
    nullable: boolean;
  }>;
  foreignKeys?: Array<{
    column: string;
    referencedTable: string;
    referencedColumn: string;
  }>;
}

interface _DatabaseSchema {
  tables: SchemaTable[];
}

interface QueryResult {
  success: boolean;
  generatedSQL: string;
  explanation: string;
  dbConnection: {
    id: string;
    title: string | null;
    database: string;
    host: string;
  };
  data?: Record<string, unknown>[];
  rowCount?: number;
  executionTime?: number;
  error?: string;
  naturalLanguageResponse?: string; // Added for business-friendly responses
}

/**
 * Format the final response based on return format preference
 */
function formatFinalResponse(
  result: QueryResult,
  message: string,
  returnFormat: string
): QueryResult | Partial<QueryResult> {
  // For natural language format, prioritize the natural language response
  // and minimize technical details
  if (returnFormat === 'natural-language') {
    if (result.naturalLanguageResponse) {
      // Return a simplified response focused on the natural language answer
      return {
        success: result.success,
        naturalLanguageResponse: result.naturalLanguageResponse,
        rowCount: result.rowCount,
        executionTime: result.executionTime,
        // Only include error if query failed
        ...(result.error && { error: result.error }),
      };
    }
    if (result.success && result.rowCount === 0) {
      // Handle case where query succeeded but no data found
      return {
        success: true,
        naturalLanguageResponse: `I didn't find any results for "${message}". This could mean there's no data matching your criteria, or the information might be stored under different terms. Would you like to try rephrasing your question?`,
        rowCount: 0,
        executionTime: result.executionTime,
      };
    }
  }

  return result;
}

export const databaseQueryTool = createTool({
  id: 'database-query-tool',
  description:
    'Generate and execute dynamic SQL queries based on natural language messages using database connections',
  inputSchema: z.object({
    message: z.string().describe('Natural language message describing what data you want to query'),
    dbConnectionId: z.string().describe('Database connection ID from DbConnection table'),
    userId: z.string().describe('User ID for security context'),
    executeQuery: z
      .boolean()
      .default(true)
      .describe('Whether to execute the generated query or just return the SQL'),
    maxRows: z.number().min(1).max(1000).default(100).describe('Maximum number of rows to return'),
    returnFormat: z
      .enum(['technical', 'natural-language'])
      .default('natural-language')
      .describe(
        'Whether to return technical data or a business-friendly natural language response'
      ),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    generatedSQL: z.string().optional(),
    explanation: z.string().optional(),
    data: z.array(z.record(z.unknown())).optional(),
    rowCount: z.number().optional(),
    executionTime: z.number().optional(),
    error: z.string().optional(),
    naturalLanguageResponse: z.string().optional(), // Added for business-friendly responses
    dbConnection: z
      .object({
        id: z.string(),
        title: z.string().optional(),
        database: z.string(),
        host: z.string(),
      })
      .optional(),
  }),
  execute: async ({ context }) => {
    const {
      message,
      dbConnectionId,
      userId,
      executeQuery = true,
      maxRows = 100,
      returnFormat = 'natural-language',
    } = context;
    const startTime = Date.now();

    try {
      // 1. Validate and get database connection
      const dbConnection = await validateAndGetDbConnection(dbConnectionId, userId);
      if (!dbConnection.success) {
        return { success: false, error: dbConnection.error };
      }

      // 2. Get schema context
      const schemaContext = await getSchemaContext(dbConnection.data);

      // 3. Generate SQL using AI
      const sqlResult = await generateSecureSQL(message, schemaContext, { userId }, maxRows);
      if (!sqlResult.sql) {
        return {
          success: false,
          error: 'Could not generate SQL query from your message',
          explanation: sqlResult.explanation,
        };
      }

      // 4. Build initial result
      const result = buildInitialResult(sqlResult, dbConnection.data);
      console.log('🚀 ~ result:', result);

      // 5. Execute query if requested
      if (executeQuery) {
        await processQueryExecution(
          result,
          sqlResult,
          dbConnection.data,
          message,
          returnFormat,
          startTime
        );
      }

      return formatFinalResponse(result, message, returnFormat);
    } catch (error) {
      console.error('Database query tool error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime: Date.now() - startTime,
      };
    }
  },
});

/**
 * Validate and get database connection with proper access control
 */
async function validateAndGetDbConnection(
  dbConnectionId: string,
  _userId: string
): Promise<{
  success: boolean;
  data?: DbConnectionInfo;
  error?: string;
}> {
  // const dbConnection = await prisma.dbConnection.findFirst({
  //   where: {
  //     id: dbConnectionId,
  //     company: {
  //       users: {
  //         some: {
  //           id: userId,
  //         },
  //       },
  //     },
  //   },
  //   include: {
  //     company: true,
  //   },
  // });

  // if (!dbConnection) {
  //   return {
  //     success: false,
  //     error: 'Database connection not found or access denied',
  //   };
  // }

  // return {
  //   success: true,
  //   data: {
  //     id: dbConnection.id,
  //     title: dbConnection.title,
  //     database: dbConnection.database,
  //     host: dbConnection.host,
  //     businessContext: dbConnection.businessContext,
  //   },
  // };

  // Temporary mock data for testing without database
  return {
    success: true,
    data: {
      id: dbConnectionId,
      title: 'Mock Database Connection',
      database: 'mock_db',
      host: 'localhost',
      businessContext: 'Mock business context',
    },
  };
}

/**
 * Get schema context for the database connection
 */
async function getSchemaContext(dbConnection: DbConnectionInfo): Promise<string> {
  try {
    // const cachedSchema = await prisma.schemaCache.findUnique({
    //   where: { dbConnectionId: dbConnection.id },
    // });

    // if (cachedSchema) {
    //   const schema = cachedSchema.schema as unknown as DatabaseSchema;
    //   return generateSchemaContext(schema);
    // }

    // Default schema context when no cache is available
    return `
DATABASE SCHEMA CONTEXT:
Database: ${dbConnection.database}
Host: ${dbConnection.host}
Business Context: ${dbConnection.businessContext || 'No specific business context provided'}

Note: Schema details are being loaded from cached metadata.
    `.trim();
  } catch (error) {
    console.warn('Could not load schema context:', error);
    return `Database: ${dbConnection.database} (Schema information unavailable)`;
  }
}

/**
 * Build initial query result object
 */
function buildInitialResult(
  sqlResult: SQLQueryResult,
  dbConnection: DbConnectionInfo
): QueryResult {
  return {
    success: true,
    generatedSQL: sqlResult.sql || '',
    explanation: sqlResult.explanation,
    dbConnection: {
      id: dbConnection.id,
      title: dbConnection.title,
      database: dbConnection.database,
      host: dbConnection.host,
    },
  };
}

/**
 * Process query execution and update result
 */
async function processQueryExecution(
  result: QueryResult,
  sqlResult: SQLQueryResult,
  dbConnection: DbConnectionInfo,
  message: string,
  returnFormat: string,
  startTime: number
): Promise<void> {
  if (!sqlResult.sql) return;

  const executionResult = await executeGeneratedSQL(sqlResult.sql, sqlResult.values, dbConnection);

  if (executionResult.success) {
    result.data = executionResult.data;
    result.rowCount = executionResult.rowCount;
    result.executionTime = Date.now() - startTime;

    // Generate natural language response if requested
    if (
      returnFormat === 'natural-language' &&
      executionResult.data &&
      executionResult.data.length > 0
    ) {
      result.naturalLanguageResponse = await generateNaturalLanguageResponse(
        message,
        executionResult.data,
        executionResult.rowCount || 0
      );
    }
  } else {
    result.success = false;
    result.error = executionResult.error;
  }
}

/**
 * Generate secure SQL using AI with context and constraints
 */
async function generateSecureSQL(
  question: string,
  schemaContext: string,
  userContext: { userId: string },
  maxRows = 100
): Promise<SQLQueryResult> {
  // Use the dynamic schema context provided - no hardcoded tables

  const prompt = `
You are a SQL query generator that converts natural language questions into parameterized PostgreSQL SELECT queries.

${schemaContext}

GENERAL SQL BEST PRACTICES:
🔴 HUMAN-READABLE RESULTS:
- ALWAYS JOIN to get human-readable names for ALL foreign key references
- Never return raw UUIDs/IDs without corresponding descriptive names
- Use meaningful column aliases for ALL result columns
- Include descriptive names even if user doesn't explicitly ask for them

🔴 JOIN REQUIREMENTS:
- When selecting from any table with foreign keys: JOIN with related tables to get descriptive names
- Use proper JOIN syntax with clear ON conditions
- Prefer INNER JOINs unless LEFT/RIGHT JOINs are specifically needed

🔴 COLUMN NAMING CONVENTIONS:
- Use descriptive aliases like "itemName", "categoryName", "userName" etc.
- For user names: Check if table has separate firstName/lastName or single name column
- Always include primary descriptive fields (names, codes, titles) in results

SECURITY CONSTRAINTS:
- ONLY generate SELECT queries. No INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, or other modifications allowed.
- Use parameterized queries with $1, $2, etc. for all user inputs.
- Always include proper WHERE clauses to limit data access based on user context.
- Limit results with LIMIT clause (max ${maxRows} rows unless specifically asked for more).
- Never expose sensitive information like passwords, tokens, or encrypted data.

QUERY STRUCTURE:
- Use proper PostgreSQL syntax
- Include meaningful WHERE conditions when appropriate
- Use ORDER BY for logical result ordering
- Always add LIMIT to prevent excessive data return

USER CONTEXT:
- User ID: ${userContext.userId}

QUESTION: "${question}"

🚨 IMPORTANT: Generate SQL based on the actual schema provided above. Use the real table and column names from the schema context.

Respond with JSON in this exact format:
{
  "sql": "SELECT ... FROM ... JOIN ... WHERE ... ORDER BY ... LIMIT ${maxRows}",
  "values": [value1, value2, ...],
  "explanation": "Brief explanation of what the query does and what data it returns"
}

Make sure the SQL uses actual table/column names from the schema and includes JOINs for readable results.
  `.trim();

  try {
    const model = openrouter.getModel();

    // Use the correct method for the OpenRouter model
    const response = await model.doGenerate({
      inputFormat: 'messages',
      mode: { type: 'regular' },
      prompt: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }],
        },
      ],
      temperature: 0.1, // Low temperature for consistent SQL generation
    });

    const aiResponseText = response.text || '';

    // Clean and parse the JSON response
    const cleanResponse = aiResponseText.replace(/```json|```/g, '').trim();

    let parsed: ParsedAIResponse;
    try {
      parsed = JSON.parse(cleanResponse);
    } catch {
      // Try to extract JSON from the response if it's embedded in text
      const jsonRegex = /\{[\s\S]*\}/;
      const jsonMatch = jsonRegex.exec(cleanResponse);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

    // Validate the response structure
    if (!parsed.sql || !Array.isArray(parsed.values) || !parsed.explanation) {
      throw new Error('Invalid response format from AI');
    }

    // Additional security validation - ensure it's only a SELECT query
    const sqlUpper = parsed.sql.trim().toUpperCase();
    if (!sqlUpper.startsWith('SELECT')) {
      throw new Error('Only SELECT queries are allowed');
    }

    // Check for dangerous keywords
    const dangerousKeywords = [
      'INSERT',
      'UPDATE',
      'DELETE',
      'DROP',
      'CREATE',
      'ALTER',
      'TRUNCATE',
      'GRANT',
      'REVOKE',
      'EXEC',
      'EXECUTE',
      'CALL',
    ];

    for (const keyword of dangerousKeywords) {
      if (sqlUpper.includes(keyword)) {
        throw new Error(`Query contains forbidden keyword: ${keyword}`);
      }
    }

    return {
      sql: parsed.sql,
      values: parsed.values,
      explanation: parsed.explanation,
    };
  } catch (error) {
    console.error('Error generating SQL:', error);
    return {
      sql: null,
      values: [],
      explanation: `Error generating query: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Execute the generated SQL query against the actual database
 * This function connects to the external database and executes the query
 */
async function executeGeneratedSQL(
  sql: string,
  values: unknown[],
  dbConnection: DbConnectionInfo
): Promise<QueryExecutionResult> {
  try {
    console.log('Database Query Execution:');
    console.log('- SQL:', sql);
    console.log('- Parameters:', values);
    console.log('- Database:', `${dbConnection.host}:${dbConnection.database}`);
    console.log('- Connection ID:', dbConnection.id);

    // // Step 1: Get database credentials with decrypted password
    // const fullDbConnection = await prisma.dbConnection.findUnique({
    //   where: { id: dbConnection.id },
    //   select: {
    //     host: true,
    //     port: true,
    //     database: true,
    //     username: true,
    //     encryptedPassword: true,
    //     sslEnabled: true,
    //   },
    // });
    // console.log('🚀 ~ fullDbConnection:', fullDbConnection);

    // if (!fullDbConnection) {
    //   throw new Error('Database connection not found');
    // }

    // // Step 2: Get encryption key from environment
    // const encryptionKey = process.env.DB_ENCRYPTION_KEY;
    // if (!encryptionKey) {
    //   throw new Error('Database encryption key not configured');
    // }

    // // Step 3: Build credentials with decrypted password
    // const credentials: DbCredentials = {
    //   host: fullDbConnection.host,
    //   port: fullDbConnection.port,
    //   database: fullDbConnection.database,
    //   username: fullDbConnection.username,
    //   password: decryptPassword(fullDbConnection.encryptedPassword, encryptionKey),
    //   sslEnabled: fullDbConnection.sslEnabled,
    // };

    // // Step 4: Execute query using connection helper
    // const queryResult = await withDbConnection(credentials, async (client: PoolClient) => {
    //   const result = await client.query(sql, values);
    //   console.log('🚀 ~ result:', result);
    //   return {
    //     rows: result.rows,
    //     rowCount: result.rowCount || 0,
    //   };
    // });
    // console.log('🚀 ~ queryResult:', queryResult);

    // return {
    //   success: true,
    //   data: queryResult.rows as Record<string, unknown>[],
    //   rowCount: queryResult.rowCount,
    // };

    // Mock response for testing without database
    return {
      success: true,
      data: [{ id: 1, name: 'Mock Data', description: 'This is mock data for testing' }],
      rowCount: 1,
    };
  } catch (error) {
    console.error('Database execution error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Query execution failed',
      rowCount: 0,
    };
  }
}

async function generateNaturalLanguageResponse(
  originalMessage: string,
  queryData: Record<string, unknown>[],
  rowCount: number
): Promise<string> {
  try {
    const prompt = `
You are a helpful business assistant that provides clear, conversational answers about company data. You should respond as if you're talking to a business user who asked a question.

USER'S QUESTION: "${originalMessage}"
RECORDS FOUND: ${rowCount}

ACTUAL DATA RESULTS:
${JSON.stringify(queryData, null, 2)}

IMPORTANT INSTRUCTIONS:
1. **Be Conversational**: Write like you're having a friendly business conversation
2. **Focus on Data**: Lead with the actual findings, not technical explanations
3. **Be Specific**: Use the exact names, numbers, and details from the data
4. **No Technical Jargon**: Don't mention SQL, queries, or database terms
5. **Business Context**: Explain what the findings mean for the business
6. **Actionable**: Suggest what they might want to do with this information

RESPONSE STRUCTURE:
- Start with a direct answer to their question
- Show the specific data/results with key details
- Explain what this means for the business
- End with helpful suggestions or insights

TONE: Professional but friendly, like a knowledgeable colleague helping out

Remember: You're not a database assistant, you're a business intelligence helper who happens to have access to company data.

Generate a conversational business response:
    `.trim();

    const model = openrouter.getModel();

    const response = await model.doGenerate({
      inputFormat: 'messages',
      mode: { type: 'regular' },
      prompt: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }],
        },
      ],
      temperature: 0.3, // Slightly higher for more natural conversation
    });

    return (
      response.text ||
      'I found some results for your question, but I need to format them better. Let me try again.'
    );
  } catch (error) {
    console.error('Error generating natural language response:', error);
    return `I found ${rowCount} results for your question about ${originalMessage}. The data shows relevant information that I can help you analyze if you'd like more details.`;
  }
}
