import { MessageListInput } from '@mastra/core/dist/agent/message-list';
import { createTool } from '@mastra/core/tools';
import { PrismaClient } from '@supplysense/prisma-client';
import { createRuntimeContext } from '@supplysense/utils/server';
import { z } from 'zod';
import { queryAnalysisAgent } from '../agents/chat/query-analysis-agent';
import { QUERY_ANALYSIS_TOOL } from '../constants/system-instructions/query-analysis';

const inputSchema = z.object({
  dbConnectionId: z.string(),
  userQuery: z.string(),
});

const outputSchema = z.object({
  queryAnalysis: z.string(),
});

type QueryAnalysisOutput = z.infer<typeof outputSchema>;

const prisma = new PrismaClient();

function normalizeSchemaCache(schemaCache: unknown): unknown {
  if (!schemaCache) {
    return null;
  }

  const unwrapSchema = (value: unknown): unknown => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    if (value && typeof value === 'object' && 'schema' in (value as Record<string, unknown>)) {
      const { schema, ...rest } = value as Record<string, unknown> & { schema?: unknown };
      return normalizeSchemaCache(schema ?? rest);
    }
    return value;
  };

  if (Array.isArray(schemaCache)) {
    const firstItem = schemaCache[0];
    return unwrapSchema(firstItem ?? null);
  }

  return unwrapSchema(schemaCache);
}

export const queryAnalysisTool = createTool({
  id: QUERY_ANALYSIS_TOOL.NAME,
  description: QUERY_ANALYSIS_TOOL.DESCRIPTION,
  inputSchema,
  outputSchema,
  execute: async (
    { context, runtimeContext },
    { abortSignal }: { abortSignal?: AbortSignal } = {}
  ): Promise<QueryAnalysisOutput> => {
    if (abortSignal?.aborted) {
      throw new Error('Query analysis request was aborted');
    }

    const runtimeCtxGetter =
      runtimeContext &&
      typeof runtimeContext === 'object' &&
      runtimeContext !== null &&
      'get' in runtimeContext &&
      typeof (runtimeContext as { get?: (key: string) => unknown }).get === 'function'
        ? ((runtimeContext as { get: (key: string) => unknown }).get.bind(runtimeContext) as (
            key: string
          ) => unknown)
        : undefined;

    const dbConnectionId =
      context.dbConnectionId ??
      (runtimeCtxGetter ? (runtimeCtxGetter('dbConnectionId') as string) : undefined);
    const userQuery =
      context.userQuery ??
      (runtimeCtxGetter ? (runtimeCtxGetter('userQuery') as string) : undefined);

    if (!dbConnectionId) {
      throw new Error('Database connection ID is required to analyze queries');
    }

    if (!userQuery) {
      throw new Error('User query is required to analyze queries');
    }

    if (abortSignal?.aborted) {
      throw new Error('Query analysis request was aborted');
    }

    //get db context form db connection table
    const dbConnection = await prisma.dbConnection.findUnique({
      where: {
        id: dbConnectionId,
      },
      include: {
        SchemaCache: true,
      },
    });
    if (!dbConnection) {
      throw new Error('Database connection not found');
    }
    // then extract business context, schema cache
    const { businessContext, SchemaCache } = dbConnection;
    // console.log('businessContext', businessContext);
    // console.log('SchemaCache', SchemaCache);
    const normalizedSchemaCache = normalizeSchemaCache(SchemaCache);
    // Build runtime context and call the agent without explicit system prompt
    const agentRuntimeContext = createRuntimeContext({
      businessContext,
      schemaCache: normalizedSchemaCache,
      userQuery,
    });

    const messages = userQuery
      ? ([{ role: 'user', content: `User Query: ${userQuery}` }] as MessageListInput)
      : [];

    const agentResponse = await queryAnalysisAgent.generate(messages, {
      abortSignal,
      runtimeContext: agentRuntimeContext,
    });
    const result = {
      queryAnalysis: agentResponse.text.trim(),
    };

    // return agent response
    return result;
  },
});
