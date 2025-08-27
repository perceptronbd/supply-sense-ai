import { createTool } from '@mastra/core';
import { PrismaClient } from '@supplysense/prisma-client';
import { DbCredentials, decryptPassword, withDbConnection } from '@supplysense/utils/server';
import { PoolClient } from 'pg';
import { z } from 'zod';
import { sqlGenerationAgent } from '../agents/sql-generation-agent';
import { EXECUTE_QUERY_TOOL } from '../constants/system-instructions/sql-generation';

const inputSchema = z.object({
  dbConnectionId: z.string(),
  queryAnalysis: z.string(),
});

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
    console.log('🚀 > input:', input);

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
    if (!SchemaCache || !SchemaCache.schema) {
      throw new Error(
        'Schema cache not found. Please ensure the database schema has been analyzed and cached.'
      );
    }

    // Log available schema information for debugging
    console.log('📋 Available schema tables:', Object.keys(SchemaCache.schema));

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
    console.log('🚀 > credentials:', credentials);

    // Generate SQL query using the SQL generation agent
    const agentResponse = await sqlGenerationAgent.generate([
      {
        role: 'system',
        content: `You are a SQL generation expert who creates accurate PostgreSQL queries based on analysis and database schema.
                
                CRITICAL: You MUST use the EXACT table and column names from the schema cache provided below.
                Do NOT assume or guess table names. Only use tables and columns that exist in the schema.
                
                Available context:
                - Business Context: ${businessContext}
                - Schema Cache: ${JSON.stringify(SchemaCache, null, 2)}
                - Query Analysis: ${input.context.queryAnalysis}
                
                IMPORTANT RULES:
                1. Only reference tables and columns that exist in the Schema Cache
                2. Use the exact case-sensitive names from the schema
                3. If the requested data cannot be found in the available schema, return an informative error message
                4. Generate clean, executable PostgreSQL queries without any markdown formatting
                5. Always include proper JOINs based on the relationships defined in the schema
                
                Generate a clean, executable PostgreSQL query that addresses the analyzed user request.
                Return ONLY the SQL query without any explanations or formatting.`,
      },
      {
        role: 'user',
        content: `Based on this analysis and the provided schema, generate the appropriate SQL query: ${input.context.queryAnalysis}`,
      },
    ]);

    const sqlQuery = agentResponse.text
      .trim()
      // Remove markdown code blocks
      .replace(/```sql\s*/gi, '')
      .replace(/```\s*/g, '')
      // Remove any leading/trailing whitespace and newlines
      .replace(/^\s+|\s+$/g, '')
      // Ensure query ends with semicolon if it doesn't already
      .replace(/;?$/, ';');

    console.log('🚀 > sqlQuery:', sqlQuery);

    // Execute the SQL query against the database
    let queryResults: unknown[] = [];

    try {
      queryResults = await withDbConnection(credentials, async (client: PoolClient) => {
        const result = await client.query(sqlQuery);
        return result.rows;
      });
    } catch (error) {
      console.error('SQL execution error:', error);

      // Provide more specific error messages for common issues
      if (error.code === '42P01') {
        const availableTables = SchemaCache?.schema ? Object.keys(SchemaCache.schema) : [];
        throw new Error(
          `Table does not exist. Available tables in schema: ${availableTables.join(', ')}. \nGenerated query: ${sqlQuery}\nOriginal error: ${error.message}`
        );
      }

      throw new Error(
        `Failed to execute SQL query: ${error.message}\nGenerated query: ${sqlQuery}`
      );
    }

    return {
      sqlQuery,
      queryResults,
    };
  },
});
