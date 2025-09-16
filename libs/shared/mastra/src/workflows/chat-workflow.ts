import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { executeQueryTool } from '../tools/execute-query-tool';
import { formatResultsTool } from '../tools/format-results-tool';
import { queryAnalysisTool } from '../tools/query-analysis-tools';

// Step 1: Query Analysis
const queryAnalysisStep = createStep({
  id: 'query-analysis',
  description: 'Analyze the user query to understand intent and required data',
  inputSchema: z.object({
    dbConnectionId: z.string().describe('Database connection ID'),
    userQuery: z.string().describe("The user's natural language query"),
  }),
  outputSchema: z.object({
    dbConnectionId: z.string(),
    userQuery: z.string(),
    queryAnalysis: z.string(),
  }),
  execute: async (context) => {
    const { dbConnectionId, userQuery } = context.inputData;

    // Call the actual queryAnalysisTool
    const result = await queryAnalysisTool.execute({
      context: {
        dbConnectionId,
        userQuery,
      },
    } as any);

    return {
      dbConnectionId,
      userQuery,
      queryAnalysis: result.queryAnalysis,
    };
  },
});

// Step 2: Execute Query
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
  execute: async (context) => {
    const { dbConnectionId, userQuery, queryAnalysis } = context.inputData;

    // Call the actual executeQueryTool
    const result = await executeQueryTool.execute({
      context: {
        dbConnectionId,
        userQuery,
        queryAnalysis,
      },
    } as any);

    return {
      dbConnectionId,
      userQuery,
      queryAnalysis,
      sqlQuery: result.sqlQuery,
      queryResults: result.queryResults,
    };
  },
});

// Step 3: Format Results
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
    visualizationType: z.enum(['table', 'bar', 'pie', 'line', 'doughnut', 'text']),
    formattedData: z.union([
      // Chart.js data structure
      z.object({
        labels: z.array(z.string()),
        datasets: z.array(
          z.object({
            label: z.string(),
            data: z.array(z.number()),
          })
        ),
      }),
      // Array of objects for table data
      z.array(z.record(z.any())),
      // Simple text
      z.string(),
    ]),
    summary: z.string(),
    message: z.string(),
  }),
  execute: async (context) => {
    const { userQuery, sqlQuery, queryResults } = context.inputData;

    // Call the actual formatResultsTool
    const result = await formatResultsTool.execute({
      context: {
        userQuery,
        sqlQuery,
        queryResults,
      },
    } as any);

    return {
      visualizationType: result.visualizationType,
      formattedData: result.formattedData,
      summary: result.summary,
      message: result.summary, // Using summary as message since formatResultsTool doesn't return a message field
    };
  },
});
export const CHART_WORKFLOW_NAME = 'chat-query-processing';
export const chatWorkflow = createWorkflow({
  id: CHART_WORKFLOW_NAME,
  description: 'Process user chat queries through analysis, execution, and formatting',
  inputSchema: z.object({
    dbConnectionId: z.string().describe('Database connection ID'),
    userQuery: z.string().describe("The user's natural language query"),
  }),
  outputSchema: z.object({
    visualizationType: z.enum(['table', 'bar', 'pie', 'line', 'doughnut', 'text']),
    formattedData: z.union([
      // Chart.js data structure
      z.object({
        labels: z.array(z.string()),
        datasets: z.array(
          z.object({
            label: z.string(),
            data: z.array(z.number()),
          })
        ),
      }),
      // Array of objects for table data
      z.array(z.record(z.any())),
      // Simple text
      z.string(),
    ]),
    summary: z.string(),
    message: z.string(),
  }),
})
  .then(queryAnalysisStep)
  .then(executeQueryStep)
  .then(formatResultsStep)
  .commit();
