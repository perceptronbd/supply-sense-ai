import { createTool } from '@mastra/core';
import { EXECUTE_QUERY_TOOL, SQL_GENERATION_QUERY_SYSTEM_PROMPT } from '@supplysense/constant';
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

// Removed formatQueryResults import

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

// Updated output schema to only include raw query results
const outputSchema = z.object({
  sqlQuery: z.string(),
  queryResults: z.array(z.record(z.any())),
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
            content: SQL_GENERATION_QUERY_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: ` Available context:
                - Business Context: ${businessContext}
                - Schema Cache: ${JSON.stringify(parsedSchema, null, 2)}
                - Query Analysis: ${input.context.queryAnalysis}

                 EXACT TABLE NAMES (use these exactly): ${Object.keys(parsedSchema.tables).join(', ')}
                 CRITICAL QUOTING RULES:
                   - Table names: Use exact case and quote if mixed case: ${Object.keys(parsedSchema.tables).map(name => /[A-Z]/.test(name) ? `"${name}"` : name).join(', ')}
                   - Column quoting rules:
                   - ${generateColumnQuotingGuidance(parsedSchema)}
                
                Based on this analysis and the provided schema, generate the appropriate SQL query: ${input.context.queryAnalysis}`,
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

    // Return raw query results without formatting
    return {
      sqlQuery,
      queryResults: queryResults as Record<string, unknown>[],
    };
  },
});

// Helper function to generate column quoting guidance from schema
function generateColumnQuotingGuidance(parsedSchema: ParsedSchema): string {
  const guidance: string[] = [];

  for (const [tableName, tableInfo] of Object.entries(parsedSchema.tables)) {
    if (typeof tableInfo === 'object' && tableInfo !== null && 'columns' in tableInfo) {
      // Determine if table name needs quotes
      const tableHasUppercase = /[A-Z]/.test(tableName);
      const quotedTableName = tableHasUppercase ? `"${tableName}"` : tableName;

      for (const columnName of Object.keys(tableInfo.columns)) {
        // Check if column name contains uppercase letters or mixed case
        const hasUppercase = /[A-Z]/.test(columnName);
        if (hasUppercase) {
          guidance.push(`${quotedTableName}."${columnName}" (quote column because of mixed case)`);
        } else {
          guidance.push(`${quotedTableName}.${columnName} (no quotes on column - lowercase)`);
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
