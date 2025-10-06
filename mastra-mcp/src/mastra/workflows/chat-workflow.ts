import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { executeQueryTool } from '../tools/execute-query-tool';
import { formatResultsTool } from '../tools/format-results-tool';
import { queryAnalysisTool } from '../tools/query-analysis-tools';

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
  }),
  outputSchema: z.object({
    dbConnectionId: z.string(),
    userQuery: z.string(),
    queryAnalysis: z.string(),
    sqlQuery: z.string(),
    queryResults: z.array(z.record(z.any())),
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
  }),
  outputSchema: z.object({
    visualizationType: z.enum(['table', 'bar', 'line', 'area', 'radar', 'text']),
    formattedData: z.union([
      z.record(z.string(), z.unknown()),
      z.array(z.record(z.any())),
      z.string(),
    ]),
    summary: z.string(),
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
    };
  },
});

// Main workflow with conditional branching
export const chatWorkflow = createWorkflow({
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
  }),
})
  .then(queryAnalysisStep)
  .then(executeQueryStep)
  .then(formatResultsStep)
  .commit();
