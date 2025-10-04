import { createStep, createWorkflow } from '@mastra/core/workflows';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { generateText } from 'ai';
import { z } from 'zod';
import { executeQueryTool } from '../tools/execute-query-tool';
import { formatResultsTool } from '../tools/format-results-tool';
import { queryAnalysisTool } from '../tools/query-analysis-tools';

// Step 1: AI-powered query classification
const queryClassificationStep = createStep({
  id: 'query-classification',
  description: 'Use AI to classify query as conversational or analytical',
  inputSchema: z.object({
    dbConnectionId: z.string(),
    userQuery: z.string(),
  }),
  outputSchema: z.object({
    dbConnectionId: z.string(),
    userQuery: z.string(),
    queryType: z.enum(['conversational', 'analytical']),
    confidence: z.number(),
  }),
  execute: async ({ inputData }) => {
    const { dbConnectionId, userQuery } = inputData;

    // Use a fast, cheap model for classification
    const classificationResult = await generateText({
      model: openrouter(AI_MODEL_NAMES.GPT_4_NANO),
      messages: [
        {
          role: 'system',
          content: `You are a query classifier. Classify user queries into two categories:

CONVERSATIONAL: Greetings, farewells, casual chat, simple acknowledgments, general questions about capabilities
- Examples: "hi", "hello", "how are you?", "thank you", "what can you do?", "bye", "ok", "got it"

ANALYTICAL: Data queries, analysis requests, information retrieval, complex questions requiring database access
- Examples: "show me sales data", "analyze inventory", "list suppliers", "compare Q1 and Q2", "what are the top products?"

Respond ONLY with valid JSON in this format:
{
  "queryType": "conversational" or "analytical",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`,
        },
        {
          role: 'user',
          content: userQuery,
        },
      ],
      temperature: 0,
    });

    // Parse the AI response
    let classification: {
      queryType: 'conversational' | 'analytical';
      confidence: number;
      reasoning: string;
    };

    try {
      classification = JSON.parse(classificationResult.text);
    } catch (error) {
      // Fallback if parsing fails - assume analytical to be safe
      classification = {
        queryType: 'analytical',
        confidence: 0.5,
        reasoning: 'Parse error, defaulting to analytical',
      };
    }

    return {
      dbConnectionId,
      userQuery,
      queryType: classification.queryType,
      confidence: classification.confidence,
    };
  },
});

// Step 2A: Conversational Response (for simple queries)
const conversationalResponseStep = createStep({
  id: 'conversational-response',
  description: 'Generate friendly response for conversational queries',
  inputSchema: z.object({
    dbConnectionId: z.string(),
    userQuery: z.string(),
    queryType: z.enum(['conversational', 'analytical']),
    confidence: z.number(),
  }),
  outputSchema: z.object({
    visualizationType: z.enum(['table', 'bar', 'line', 'area', 'radar', 'text']),
    formattedData: z.null(),
    summary: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { userQuery } = inputData;

    const response = await generateText({
      model: openrouter(AI_MODEL_NAMES.GPT_4_NANO),
      messages: [
        {
          role: 'system',
          content:
            'You are a friendly supply chain AI assistant. Respond naturally to casual conversation. Keep responses brief and welcoming.',
        },
        {
          role: 'user',
          content: userQuery,
        },
      ],
      temperature: 0.7,
    });

    return {
      visualizationType: 'text' as const,
      formattedData: null,
      summary: response.text,
    };
  },
});

// Step 2B: Query Analysis (for analytical queries)
const queryAnalysisStep = createStep({
  id: 'query-analysis',
  description: 'Analyze the user query to understand data requirements',
  inputSchema: z.object({
    dbConnectionId: z.string(),
    userQuery: z.string(),
    queryType: z.enum(['conversational', 'analytical']),
    confidence: z.number(),
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
    } as any);

    return {
      dbConnectionId,
      userQuery,
      queryAnalysis: result.queryAnalysis,
    };
  },
});

// Step 3: Execute Query
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

// Step 4: Format Results
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
        userQuery,
        sqlQuery,
        queryResults,
      },
    } as any);

    return {
      visualizationType: result.visualizationType,
      formattedData: result.formattedData,
      summary: result.summary,
    };
  },
});

// Create analytical workflow (steps 2B-4)
const analyticalWorkflow = createWorkflow({
  id: 'analytical-sub-workflow',
  inputSchema: z.object({
    dbConnectionId: z.string(),
    userQuery: z.string(),
    queryType: z.enum(['conversational', 'analytical']),
    confidence: z.number(),
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
})
  .then(queryAnalysisStep)
  .then(executeQueryStep)
  .then(formatResultsStep)
  .commit();

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
  .then(queryClassificationStep)
  .branch([
    // Branch 1: Conversational queries
    [async ({ inputData }) => inputData.queryType === 'conversational', conversationalResponseStep],
    // Branch 2: Analytical queries (full workflow)
    [async ({ inputData }) => inputData.queryType === 'analytical', analyticalWorkflow],
  ])
  .commit();
