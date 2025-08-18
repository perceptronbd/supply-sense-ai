import { createTool } from '@mastra/core/tools';
import { PrismaClient } from '@prisma/client';
import { GetOpenRouter } from '@supplysense/utils';
import { z } from 'zod';

const prisma = new PrismaClient();
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

interface DatabaseSchema {
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

      return result;
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
  userId: string
): Promise<{
  success: boolean;
  data?: DbConnectionInfo;
  error?: string;
}> {
  const dbConnection = await prisma.dbConnection.findFirst({
    where: {
      id: dbConnectionId,
      company: {
        users: {
          some: {
            id: userId,
          },
        },
      },
    },
    include: {
      company: true,
    },
  });

  if (!dbConnection) {
    return {
      success: false,
      error: 'Database connection not found or access denied',
    };
  }

  return {
    success: true,
    data: {
      id: dbConnection.id,
      title: dbConnection.title,
      database: dbConnection.database,
      host: dbConnection.host,
      businessContext: dbConnection.businessContext,
    },
  };
}

/**
 * Get schema context for the database connection
 */
async function getSchemaContext(dbConnection: DbConnectionInfo): Promise<string> {
  try {
    const cachedSchema = await prisma.schemaCache.findUnique({
      where: { dbConnectionId: dbConnection.id },
    });

    if (cachedSchema) {
      const schema = cachedSchema.schema as unknown as DatabaseSchema;
      return generateSchemaContext(schema);
    }

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
        sqlResult.explanation,
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
    console.log('🚀 ~ aiResponseText:', aiResponseText);

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
 * Execute the generated SQL query
 * Note: This is a placeholder - in production you would connect to the actual database
 */
async function executeGeneratedSQL(
  sql: string,
  values: unknown[],
  dbConnection: DbConnectionInfo
): Promise<QueryExecutionResult> {
  try {
    // This is a placeholder implementation
    // In a real scenario, you would:
    // 1. Create a connection to the external database using dbConnection details (host, port, database, username)
    // 2. Decrypt the password and authenticate
    // 3. Execute the query with proper security measures and parameterized values
    // 4. Return the actual results

    console.log('Database Query Execution:');
    console.log('- SQL:', sql);
    console.log('- Parameters:', values);
    console.log('- Database:', `${dbConnection.host}:${dbConnection.database}`);
    console.log('- Connection ID:', dbConnection.id);

    // Mock implementation - return placeholder data structure
    // In production, replace this with actual database connection and query execution
    const mockData = [
      {
        id: 1,
        name: 'Sample Record 1',
        value: 'Sample Value 1',
        status: 'Active',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        name: 'Sample Record 2',
        value: 'Sample Value 2',
        status: 'Inactive',
        created_at: '2024-01-02T00:00:00Z',
      },
    ];

    return {
      success: true,
      data: mockData,
      rowCount: mockData.length,
      executionTime: 95, // Mock execution time
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Query execution failed',
      rowCount: 0,
    };
  }
}

/**
 * Generate schema context from cached schema data
 */
function generateSchemaContext(schema: DatabaseSchema): string {
  if (!schema?.tables) {
    return 'Schema information not available';
  }

  let context = 'DATABASE SCHEMA:\n\n';

  for (const table of schema.tables) {
    context += buildTableContext(table);
  }

  return context;
}

/**
 * Build context string for a single table
 */
function buildTableContext(table: SchemaTable): string {
  let tableContext = `Table: ${table.name}\n`;

  if (table.columns && table.columns.length > 0) {
    tableContext += buildColumnsContext(table.columns);
  }

  if (table.foreignKeys && table.foreignKeys.length > 0) {
    tableContext += buildForeignKeysContext(table.foreignKeys);
  }

  return `${tableContext}\n`;
}

/**
 * Build context string for table columns
 */
function buildColumnsContext(columns: SchemaTable['columns']): string {
  if (!columns) return '';

  let columnsContext = '  Columns:\n';
  for (const column of columns) {
    const nullable = column.nullable ? ' (nullable)' : ' (required)';
    columnsContext += `    - ${column.name}: ${column.type}${nullable}\n`;
  }
  return columnsContext;
}

/**
 * Generate natural language response from query results
 */
async function generateNaturalLanguageResponse(
  originalMessage: string,
  queryExplanation: string,
  queryData: Record<string, unknown>[],
  rowCount: number
): Promise<string> {
  try {
    // Analyze the data to determine the type and structure
    const dataAnalysis = analyzeQueryData(queryData);

    const prompt = `
You are a business intelligence assistant that converts database query results into clear, actionable insights for non-technical users.

ORIGINAL QUESTION: "${originalMessage}"

QUERY CONTEXT: ${queryExplanation}

DATA ANALYSIS:
- ${rowCount} records found
- Key columns: ${dataAnalysis.keyColumns.join(', ')}
- Data types detected: ${dataAnalysis.dataTypes.join(', ')}
- Potential business domain: ${dataAnalysis.businessDomain}

QUERY RESULTS:
${JSON.stringify(queryData.slice(0, 10), null, 2)} ${rowCount > 10 ? `\n... and ${rowCount - 10} more records` : ''}

INSTRUCTIONS:
1. **Business Language**: Use business terminology, not technical database jargon
2. **Key Insights**: Highlight the most important findings first  
3. **Actionable Information**: Focus on what the data means for business decisions
4. **Clear Structure**: Organize findings in a logical, easy-to-read format
5. **Context-Aware**: Tailor the response to the specific type of data and business domain

RESPONSE GUIDELINES BY DATA TYPE:
- **Performance/Metrics Data**: Focus on scores, rates, and performance indicators
- **Financial Data**: Emphasize amounts, totals, trends, and financial impact
- **Inventory Data**: Highlight stock levels, availability, and supply chain implications  
- **Customer/Contact Data**: Focus on relationships, demographics, and engagement
- **Operational Data**: Emphasize efficiency, processes, and operational insights

RESPONSE FORMAT:
- Start with a clear summary statement
- Use bullet points for key findings
- Include specific numbers but explain their business significance
- Highlight patterns, trends, or outliers
- End with actionable recommendations if appropriate
- Keep tone professional but accessible to non-technical users

Generate a business-focused response that provides clear insights and value:
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
      temperature: 0.3, // Balanced temperature for natural yet consistent responses
    });

    return response.text || 'Unable to generate business summary at this time.';
  } catch (error) {
    console.error('Error generating natural language response:', error);
    return `Found ${rowCount} results for your query: ${originalMessage}. The data is available for further analysis.`;
  }
}

/**
 * Analyze query data to understand structure and business domain
 */
function analyzeQueryData(data: Record<string, unknown>[]): {
  keyColumns: string[];
  dataTypes: string[];
  businessDomain: string;
} {
  if (!data || data.length === 0) {
    return {
      keyColumns: [],
      dataTypes: [],
      businessDomain: 'Unknown',
    };
  }

  const firstRecord = data[0];
  const columns = Object.keys(firstRecord);

  // Extract key columns
  const keyColumns = extractKeyColumns(columns);

  // Analyze data types
  const dataTypes = analyzeDataTypes(Object.values(firstRecord));

  // Determine business domain
  const businessDomain = determineBusinessDomain(columns);

  return {
    keyColumns: keyColumns.length > 0 ? keyColumns : columns.slice(0, 3),
    dataTypes: dataTypes.length > 0 ? dataTypes : ['mixed'],
    businessDomain,
  };
}

/**
 * Extract key columns from column names
 */
function extractKeyColumns(columns: string[]): string[] {
  return columns
    .filter(
      (col) =>
        col.includes('name') ||
        col.includes('title') ||
        col.includes('description') ||
        col.includes('id')
    )
    .slice(0, 5);
}

/**
 * Analyze data types from sample values
 */
function analyzeDataTypes(sampleValues: unknown[]): string[] {
  const dataTypes: string[] = [];

  if (sampleValues.some((v) => typeof v === 'number')) dataTypes.push('numerical');
  if (sampleValues.some((v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(String(v))))
    dataTypes.push('dates');
  if (sampleValues.some((v) => typeof v === 'boolean')) dataTypes.push('boolean');
  if (sampleValues.some((v) => typeof v === 'string')) dataTypes.push('text');

  return dataTypes;
}

/**
 * Determine business domain based on column names
 */
function determineBusinessDomain(columns: string[]): string {
  const allColumns = columns.join(' ').toLowerCase();

  if (allColumns.includes('supplier') || allColumns.includes('vendor')) {
    return 'Supplier Management';
  }
  if (
    allColumns.includes('inventory') ||
    allColumns.includes('stock') ||
    allColumns.includes('product')
  ) {
    return 'Inventory Management';
  }
  if (allColumns.includes('customer') || allColumns.includes('client')) {
    return 'Customer Management';
  }
  if (allColumns.includes('order') || allColumns.includes('purchase')) {
    return 'Order Management';
  }
  if (
    allColumns.includes('performance') ||
    allColumns.includes('metric') ||
    allColumns.includes('score')
  ) {
    return 'Performance Analytics';
  }
  if (
    allColumns.includes('financial') ||
    allColumns.includes('revenue') ||
    allColumns.includes('cost')
  ) {
    return 'Financial Data';
  }

  return 'General Business Data';
}

/**
 * Build context string for foreign keys
 */
function buildForeignKeysContext(foreignKeys: SchemaTable['foreignKeys']): string {
  if (!foreignKeys) return '';

  let fkContext = '  Foreign Keys:\n';
  for (const fk of foreignKeys) {
    fkContext += `    - ${fk.column} -> ${fk.referencedTable}.${fk.referencedColumn}\n`;
  }
  return fkContext;
}
