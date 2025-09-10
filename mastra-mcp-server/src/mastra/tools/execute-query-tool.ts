import { createTool } from '@mastra/core';
import { PrismaClient } from '@supplysense/prisma-client';
import {
  DbCredentials,
  decryptPassword,
  withDbConnection,
  withRetry,
} from '@supplysense/utils/server';
import { PoolClient } from 'pg';
import { z } from 'zod';
import { sqlGenerationAgent } from '../agents/sql-generation-agent';
import { EXECUTE_QUERY_TOOL } from '../constants/system-instructions/sql-generation';
import { formatQueryResults } from './format-results-tool';

// Type definitions
interface SchemaCache {
  schema: unknown;
}

interface ParsedSchema {
  tables: Record<
    string,
    {
      columns: Record<string, string>;
      label?: string;
      purpose?: string;
      relationships?: unknown[];
    }
  >;
  businessContext?: string;
}

interface SqlError {
  code?: string;
  message: string;
  hint?: string;
}

const inputSchema = z.object({
  dbConnectionId: z.string(),
  queryAnalysis: z.string(),
  userQuery: z.string().optional(), // Add user query for better formatting context
});

const outputSchema = z.object({
  sqlQuery: z.string(),
  queryResults: z.array(z.record(z.any())),
  // Include formatted response from format-results-tool
  visualizationType: z.enum(['table', 'bar', 'pie', 'line', 'doughnut', 'text']),
  formattedData: z.union([
    z.object({
      labels: z.array(z.string()),
      datasets: z.array(
        z.object({
          label: z.string(),
          data: z.array(z.number()),
        })
      ),
    }),
    z.array(z.record(z.any())),
    z.string(),
  ]),
  summary: z.string(),
});

const prisma = new PrismaClient();

export const executeQueryTool = createTool({
  id: EXECUTE_QUERY_TOOL.NAME,
  description: EXECUTE_QUERY_TOOL.DESCRIPTION,
  inputSchema,
  outputSchema,
  execute: async (input): Promise<z.infer<typeof outputSchema>> => {
    // Get db context from db connection table
    const dbConnection = await prisma.dbConnection.findUnique({
      where: {
        id: input.context.dbConnectionId,
      },
      include: {
        SchemaCache: true,
      },
    });

    if (!dbConnection) {
      throw new Error('Database connection not found');
    }

    // Extract business context and schema cache
    const {
      businessContext,
      SchemaCache,
      host,
      port,
      database,
      username,
      encryptedPassword,
      sslEnabled,
    } = dbConnection;

    // Validate schema cache exists and has content
    const parsedSchema = parseAndValidateSchema(SchemaCache);

    // Log available schema information for debugging
    logSchemaInformation(parsedSchema);

    // Build credentials from database connection fields
    const credentials: DbCredentials = {
      host,
      port,
      database,
      username,
      password: decryptPassword(
        encryptedPassword,
        process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here'
      ),
      sslEnabled: sslEnabled || false,
    };

    // Generate SQL query using the SQL generation agent with retry logic
    const agentResponse = await withRetry(
      () =>
        sqlGenerationAgent.generate([
          {
            role: 'system',
            content: `You are a SQL generation expert who creates accurate PostgreSQL queries based on analysis and database schema.
                
                CRITICAL: You MUST use the EXACT table and column names from the schema cache provided below.
                Do NOT assume or guess table names. Only use tables and columns that exist in the schema.
                
                POSTGRESQL CASE SENSITIVITY RULES - CRITICAL:
                1. For column names with mixed case (camelCase like "availableQty", "itemId"), you MUST quote them: "availableQty"
                2. For column names that are all lowercase (like "quantity", "name"), do NOT quote them
                3. Check each column name in the schema - if it contains uppercase letters, it MUST be quoted
                4. Table names are typically lowercase and don't need quotes
                5. When referencing columns with table prefix: stock."availableQty", items.name
                
                COLUMN QUOTING EXAMPLES FROM THE SCHEMA:
                - availableQty → stock."availableQty" (MUST be quoted)
                - itemId → stock."itemId" (MUST be quoted) 
                - reservedQty → stock."reservedQty" (MUST be quoted)
                - quantity → stock.quantity (no quotes needed)
                - name → items.name (no quotes needed)
                - id → items.id (no quotes needed)
                
                Available context:
                - Business Context: ${businessContext}
                - Schema Cache: ${JSON.stringify(parsedSchema, null, 2)}
                - Query Analysis: ${input.context.queryAnalysis}
                
                SCHEMA STRUCTURE:
                The schema contains a "tables" object where each key is a table name.
                Each table has:
                - "columns": object with column names as keys and their types as values
                - "label": human-readable description
                - "purpose": business purpose of the table
                - "relationships": array of foreign key relationships
                
                IMPORTANT POSTGRESQL RULES:
                1. Only reference tables and columns that exist in the Schema Cache
                2. Table names: ${Object.keys(parsedSchema.tables).join(', ')}
                3. CRITICAL QUOTING RULES FOR ALL COLUMNS:
                   - ${generateColumnQuotingGuidance(parsedSchema)}
                4. When using table prefixes, follow the patterns above
                5. PostgreSQL converts unquoted identifiers to lowercase - if column has uppercase, MUST quote
                6. If the requested data cannot be found in the available schema, return an informative error message
                7. Generate clean, executable PostgreSQL queries without any markdown formatting
                8. Always include proper JOINs based on the relationships defined in the schema
                
                CASE SENSITIVITY EXAMPLES FROM ACTUAL SCHEMA:
                - Schema: "availableQty" → SQL: stock."availableQty" (MUST quote)
                - Schema: "itemId" → SQL: stock."itemId" (MUST quote)
                - Schema: "reservedQty" → SQL: stock."reservedQty" (MUST quote)  
                - Schema: "quantity" → SQL: stock.quantity (no quotes - all lowercase)
                - Schema: "name" → SQL: items.name (no quotes - all lowercase)
                - Schema: "id" → SQL: items.id (no quotes - all lowercase)
                
                Generate a clean, executable PostgreSQL query that addresses the analyzed user request.
                Return ONLY the SQL query without any explanations or formatting.`,
          },
          {
            role: 'user',
            content: `Based on this analysis and the provided schema, generate the appropriate SQL query: ${input.context.queryAnalysis}`,
          },
        ]),
      3, // max retries
      1000 // initial delay in ms
    );

    const sqlQuery = agentResponse.text
      .trim()
      // Remove markdown code blocks
      .replace(/```sql\s*/gi, '')
      .replace(/```\s*/g, '')
      // Remove any leading/trailing whitespace and newlines
      .replace(/^\s+|\s+$/g, '')
      // Ensure query ends with semicolon if it doesn't already
      .replace(/;?$/, ';');

    // Execute the SQL query against the database
    let queryResults: unknown[] = [];

    try {
      queryResults = await withDbConnection(credentials, async (client: PoolClient) => {
        const result = await client.query(sqlQuery);
        return result.rows;
      });
    } catch (error) {
      handleSqlExecutionError(error, sqlQuery, parsedSchema);
    }

    try {
      const formattedResponse = await formatQueryResults(
        queryResults as Record<string, unknown>[],
        sqlQuery,
        input.context.userQuery || ''
      );

      return {
        sqlQuery,
        queryResults: queryResults as Record<string, unknown>[],
        visualizationType: formattedResponse.visualizationType,
        formattedData: formattedResponse.formattedData,
        summary: formattedResponse.summary,
      };
    } catch (error) {
      console.error('🚀 > error:', error);
      // Fallback to returning just the raw data
      return {
        sqlQuery,
        queryResults: queryResults as Record<string, unknown>[],
      };
    }
  },
});

// Helper function to generate column quoting guidance from schema
function generateColumnQuotingGuidance(parsedSchema: ParsedSchema): string {
  const guidance: string[] = [];

  for (const [tableName, tableInfo] of Object.entries(parsedSchema.tables)) {
    if (typeof tableInfo === 'object' && tableInfo !== null && 'columns' in tableInfo) {
      for (const columnName of Object.keys(tableInfo.columns)) {
        // Check if column name contains uppercase letters or mixed case
        const hasUppercase = /[A-Z]/.test(columnName);
        if (hasUppercase) {
          guidance.push(`${tableName}."${columnName}" (quote because of mixed case)`);
        } else {
          guidance.push(`${tableName}.${columnName} (no quotes - lowercase)`);
        }
      }
    }
  }

  return guidance.join('\n                   - ');
}

// Helper function to parse and validate schema
function parseAndValidateSchema(SchemaCache: SchemaCache): ParsedSchema {
  if (!SchemaCache || !SchemaCache.schema) {
    throw new Error(
      'Schema cache not found. Please ensure the database schema has been analyzed and cached.'
    );
  }

  let parsedSchema: ParsedSchema;
  try {
    parsedSchema =
      typeof SchemaCache.schema === 'string'
        ? JSON.parse(SchemaCache.schema)
        : (SchemaCache.schema as ParsedSchema);
  } catch (error) {
    throw new Error(
      `Failed to parse schema cache: ${error.message}. Schema content: ${SchemaCache.schema}`
    );
  }

  if (!parsedSchema || !parsedSchema.tables) {
    throw new Error(
      `Invalid schema structure. Expected 'tables' property. Got: ${JSON.stringify(parsedSchema)}`
    );
  }

  return parsedSchema;
}

// Helper function to log schema information
function logSchemaInformation(parsedSchema: ParsedSchema): void {
  console.log('📋 Available schema tables:', Object.keys(parsedSchema.tables));

  for (const [tableName, tableInfo] of Object.entries(parsedSchema.tables)) {
    console.log(
      `📊 Table ${tableName} columns:`,
      typeof tableInfo === 'object' && tableInfo !== null && 'columns' in tableInfo
        ? Object.keys(tableInfo.columns)
        : 'No column information available'
    );
  }
}

// Helper function to handle SQL execution errors
function handleSqlExecutionError(
  error: SqlError,
  sqlQuery: string,
  parsedSchema: ParsedSchema
): never {
  if (error.code === '42P01') {
    const availableTables = parsedSchema?.tables ? Object.keys(parsedSchema.tables) : [];
    throw new Error(
      `Table does not exist. Available tables in schema: ${availableTables.join(', ')}. \nGenerated query: ${sqlQuery}\nOriginal error: ${error.message}`
    );
  }

  throw new Error(`Failed to execute SQL query: ${error.message}\nGenerated query: ${sqlQuery}`);
}
