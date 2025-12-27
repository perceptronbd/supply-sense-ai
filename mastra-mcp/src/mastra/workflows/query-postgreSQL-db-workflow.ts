import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { executeQueryTool } from '../tools/execute-query-tool';
import { formatResultsTool } from '../tools/format-results-tool';
import { queryAnalysisTool } from '../tools/query-analysis-tools';

const usage = z
  .object({
    inputTokens: z.number(),
    outputTokens: z.number(),
    totalTokens: z.number(),
  })
  .optional();

// Helper to sum usage objects safely
function sumUsage(
  a?: { inputTokens: number; outputTokens: number; totalTokens: number },
  b?: { inputTokens: number; outputTokens: number; totalTokens: number }
): { inputTokens: number; outputTokens: number; totalTokens: number } | undefined {
  if (!a && !b) return undefined;
  const aIn = a?.inputTokens ?? 0;
  const aOut = a?.outputTokens ?? 0;
  const aTot = a?.totalTokens ?? 0;
  const bIn = b?.inputTokens ?? 0;
  const bOut = b?.outputTokens ?? 0;
  const bTot = b?.totalTokens ?? 0;
  return {
    inputTokens: aIn + bIn,
    outputTokens: aOut + bOut,
    totalTokens: aTot + bTot,
  };
}

type Usage = { inputTokens: number; outputTokens: number; totalTokens: number };

function normalizeUsage(u?: Partial<Usage> | undefined): Usage | undefined {
  if (!u) return undefined;
  return {
    inputTokens: u.inputTokens ?? 0,
    outputTokens: u.outputTokens ?? 0,
    totalTokens: u.totalTokens ?? 0,
  };
}

// Query Analysis (primary workflow path)
const queryAnalysisStep = createStep({
  id: 'query-analysis',
  description: 'Analyze the user query to understand data requirements',
  inputSchema: z.object({
    dbConnectionId: z.string(),
    userQuery: z.string(),
  }),
  outputSchema: z.object({
    dbConnectionId: z.string(),
    userQuery: z.string(),
    queryAnalysis: z.string(),
    usage,
  }),
  execute: async ({ inputData }) => {
    const { dbConnectionId, userQuery } = inputData;

    const result = await queryAnalysisTool.execute({
      context: {
        dbConnectionId,
        userQuery,
      },
      runtimeContext: undefined,
    });

    return {
      dbConnectionId,
      userQuery,
      queryAnalysis: result.queryAnalysis,
      usage: result.usage,
    };
  },
});

// Execute Query
const executeQueryStep = createStep({
  id: 'execute-query',
  description: 'Generate and execute SQL query based on analysis',
  inputSchema: z.object({
    dbConnectionId: z.string(),
    userQuery: z.string(),
    queryAnalysis: z.string(),
    usage,
  }),
  outputSchema: z.object({
    dbConnectionId: z.string(),
    userQuery: z.string(),
    queryAnalysis: z.string(),
    sqlQuery: z.string(),
    queryResults: z.array(z.record(z.any())),
    usage,
  }),
  execute: async ({ inputData }) => {
    const { dbConnectionId, userQuery, queryAnalysis } = inputData;

    const result = await executeQueryTool.execute({
      context: {
        dbConnectionId,
        queryAnalysis,
        userQuery,
      },
      runtimeContext: undefined,
    });

    return {
      dbConnectionId,
      userQuery,
      queryAnalysis,
      sqlQuery: result.sqlQuery,
      queryResults: result.queryResults,
      usage: sumUsage(
        normalizeUsage(
          (
            inputData as {
              usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
            }
          ).usage
        ),
        normalizeUsage(result.usage as unknown as Partial<Usage> | undefined)
      ),
    };
  },
});

// Format Results
const formatResultsStep = createStep({
  id: 'format-results',
  description: 'Format query results for user presentation',
  inputSchema: z.object({
    dbConnectionId: z.string(),
    userQuery: z.string(),
    queryAnalysis: z.string(),
    sqlQuery: z.string(),
    queryResults: z.array(z.record(z.any())),
    usage,
  }),
  outputSchema: z.object({
    visualizationType: z.enum(['table', 'bar', 'line', 'area', 'radar', 'text']),
    formattedData: z.union([
      z.record(z.string(), z.unknown()),
      z.array(z.record(z.any())),
      z.string(),
      z.null(),
    ]),
    summary: z.string(),
    usage,
  }),
  execute: async ({ inputData }) => {
    const { userQuery, sqlQuery, queryResults } = inputData;

    const result = await formatResultsTool.execute({
      context: {
        queryResults,
        sqlQuery,
        userQuery,
      },
      runtimeContext: undefined,
    });

    return {
      visualizationType: result.visualizationType,
      formattedData: result.formattedData,
      summary: result.summary,
      usage: sumUsage(
        normalizeUsage(
          (
            inputData as {
              usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
            }
          ).usage
        ),
        normalizeUsage(result.usage as unknown as Partial<Usage> | undefined)
      ),
    };
  },
});

// Main workflow with conditional branching
export const queryPostgreSQLdbWorkflow = createWorkflow({
  id: 'chat-query-processing',
  description: 'AI-powered query processing with smart classification',
  inputSchema: z.object({
    dbConnectionId: z.string().describe('Database connection ID'),
    userQuery: z.string().describe("The user's natural language query"),
  }),
  outputSchema: z.object({
    visualizationType: z.enum(['table', 'bar', 'line', 'area', 'radar', 'text']),
    formattedData: z.union([
      z.record(z.string(), z.unknown()),
      z.array(z.record(z.any())),
      z.string(),
      z.null(),
    ]),
    summary: z.string(),
    usage,
  }),
})
  .then(queryAnalysisStep)
  .then(executeQueryStep)
  .then(formatResultsStep)
  .commit();
