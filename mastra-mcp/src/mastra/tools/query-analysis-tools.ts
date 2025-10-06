import { createTool } from '@mastra/core';
import { PrismaClient } from '@supplysense/prisma-client';
import { z } from 'zod';
import { queryAnalysisAgent } from '../agents/query-analysis-agent';
import {
  QUERY_ANALYSIS_SYSTEM_PROMPT,
  QUERY_ANALYSIS_TOOL,
} from '../constants/system-instructions/query-analysis';

const inputSchema = z.object({
  dbConnectionId: z.string(),
  userQuery: z.string(),
});

const outputSchema = z.object({
  queryAnalysis: z.string(),
});

const prisma = new PrismaClient();

export const queryAnalysisTool = createTool({
  id: QUERY_ANALYSIS_TOOL.NAME,
  description: QUERY_ANALYSIS_TOOL.DESCRIPTION,
  inputSchema,
  outputSchema,
  execute: async (input): Promise<z.infer<typeof outputSchema>> => {
    //get db context form db connection table
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
    // then extract business context, schema cache
    const { businessContext, SchemaCache } = dbConnection;
    console.log('businessContext', businessContext);
    console.log('SchemaCache', SchemaCache);
    // call the query analysis agent and pass the business context and schema cache to the system prompt and user query to the user prompt

    const agentResponse = await queryAnalysisAgent.generate([
      {
        role: 'system',
        content: QUERY_ANALYSIS_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: ` Available context:
            - Business Context: ${businessContext}
            - Schema Cache: ${JSON.stringify(SchemaCache, null, 2)}
            - User Query: ${input.context.userQuery}`,
      },
    ]);

    const result = {
      queryAnalysis: agentResponse.text.trim(),
    };

    // return agent response
    return result;
  },
});
