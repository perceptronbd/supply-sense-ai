import { createTool } from '@mastra/core';
import { PrismaClient } from '@supplysense/prisma-client';
import {
  createRuntimeContext,
  DbCredentials,
  decryptPassword,
  withDbConnection,
  withRetry,
} from '@supplysense/utils/server';
import { PoolClient } from 'pg';
import { z } from 'zod';
import { mastra } from '..';
import { EXECUTE_QUERY_TOOL } from '../constants/system-instructions/sql-generation';

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
    const encryptionKey = process.env.DB_ENCRYPTION_KEY ?? process.env.ENCRYPTION_KEY ?? undefined;

    if (!encryptionKey) {
      throw new Error('DB_ENCRYPTION_KEY environment variable is not set for the MCP server');
    }

    const credentials: DbCredentials = {
      host,
      port,
      database,
      username,
      password: decryptPassword(encryptedPassword, encryptionKey),
      sslEnabled: sslEnabled || false,
    };

    // Generate SQL query using the SQL generation agent with retry logic
    const agent = mastra.getAgent('sqlGenerationAgent');
    const runtimeContext = createRuntimeContext({
      businessContext,
      parsedSchema,
      queryAnalysis: input.context.queryAnalysis,
    });

    const agentResponse = await withRetry(() => agent.generate([], { runtimeContext }), 3, 1000);

    let sqlQuery = agentResponse.text
      .trim()
      // Remove markdown code blocks
      .replace(/```sql\s*/gi, '')
      .replace(/```\s*/g, '')
      // Remove any leading/trailing whitespace and newlines
      .replace(/^\s+|\s+$/g, '')
      // Ensure query ends with semicolon if it doesn't already
      .replace(/;?$/, '');

    // Make the query case-insensitive by modifying string comparisons
    sqlQuery = `${sqlQuery
      // Convert all LIKE to ILIKE for case-insensitive comparison
      .replace(/\bLIKE\b/gi, 'ILIKE')
      // Ensure string literals in WHERE/AND/OR conditions are properly formatted
      .replace(
        /(WHERE|AND|OR)\s+([^=<>!]+)\s*=\s*'([^']*)'/gi,
        (_match, operator, column, value) =>
          `${operator} LOWER(${column.trim()}) = LOWER('${value}')`
      )};`;

    console.log('🚀 > sqlQuery:', sqlQuery);

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
function _generateColumnQuotingGuidance(parsedSchema: ParsedSchema): string {
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
