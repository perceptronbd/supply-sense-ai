import { createTool } from '@mastra/core';
import { MessageListInput } from '@mastra/core/dist/agent/message-list';
import { Logger } from '@nestjs/common';
import { createRuntimeContext } from '@supplysense/utils/server';
import type { ChartData } from 'recharts/types/state/chartDataSlice';
import { z } from 'zod';
import { formattingAgent } from '../agents/chat/formatting-agent';
import { FORMAT_RESULTS_TOOL } from '../constants/system-instructions/result-formatting';

// Union type for different data formats
// Support flexible array of objects for table data, preserving original query structure
type FormattedData = ChartData | Record<string, unknown>[] | string;

type FormattedResults = {
  visualizationType: 'table' | 'bar' | 'line' | 'area' | 'radar' | 'text';
  formattedData: FormattedData;
  summary: string;
};

const inputSchema = z.object({
  queryResults: z.array(z.record(z.unknown())),
  sqlQuery: z.string(),
  userQuery: z.string().optional(),
});

const outputSchema = z.object({
  visualizationType: z.enum(['table', 'bar', 'line', 'area', 'radar', 'text']),
  formattedData: z.union([
    // Recharts data structure
    z.record(z.string(), z.unknown()),
    // Array of objects for table data (flexible format for any query results)
    z.array(z.record(z.any())),
    // Simple text
    z.string(),
  ]),
  summary: z.string(),
});

// Export the formatting logic so it can be called directly
export async function formatQueryResults(
  queryResults: Record<string, unknown>[],
  sqlQuery: string,
  userQuery?: string
) {
  const logger = new Logger('formatQueryResults');
  logger.debug(' formatQueryResults: queryResults:', queryResults);
  logger.debug(' formatQueryResults: sqlQuery:', sqlQuery);
  logger.debug(' formatQueryResults: userQuery:', userQuery);

  const runtimeContext = createRuntimeContext({
    queryResults,
    sqlQuery,
  });

  // Analyze the query results to determine visualization format
  const messages: MessageListInput = [
    {
      role: 'user',
      content: userQuery
        ? `User Query: ${userQuery}`
        : `Format the results for SQL query: ${sqlQuery}`,
    },
  ];

  const agentResponse = await formattingAgent.generate(messages, {
    runtimeContext,
  });

  let result: FormattedResults;
  try {
    // Parse the agent response as JSON
    const responseText = agentResponse.text.trim();
    // Remove any markdown code blocks if present
    const cleanedResponse = responseText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsedResponse = JSON.parse(cleanedResponse);

    // Map 'explanation' to 'summary' if needed (agent returns 'explanation')
    result = {
      visualizationType: parsedResponse.visualizationType,
      formattedData: parsedResponse.formattedData,
      summary: parsedResponse.summary || parsedResponse.explanation,
    };
  } catch (error) {
    console.error('error:', error);
    // Fallback to table format if parsing fails
    result = {
      visualizationType: 'table',
      formattedData: queryResults, // Return the raw query results as-is
      summary: `Query returned ${queryResults.length} records`,
    };
  }

  // Validate the response has required fields
  if (!result.visualizationType || !result.formattedData || !result.summary) {
    // Provide fallback response
    return {
      visualizationType: 'table' as const,
      formattedData: queryResults, // Return the raw query results as-is
      summary: `Query returned ${queryResults.length} records`,
    };
  }

  return result;
}

export const formatResultsTool = createTool({
  id: FORMAT_RESULTS_TOOL.NAME,
  description: FORMAT_RESULTS_TOOL.DESCRIPTION,
  inputSchema,
  outputSchema,
  execute: async ({ context: input }): Promise<FormattedResults> => {
    const { queryResults, sqlQuery, userQuery } = input;

    // Call the extracted formatting function
    return await formatQueryResults(queryResults, sqlQuery, userQuery);
  },
});
