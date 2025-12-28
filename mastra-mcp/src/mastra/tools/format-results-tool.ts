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
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
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
  usage: z
    .object({
      inputTokens: z.number(),
      outputTokens: z.number(),
      totalTokens: z.number(),
    })
    .optional(),
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
    userQuery,
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

  console.log('formatQueryResults usage', agentResponse.usage);
  // Fallback token estimation if provider doesn't return usage
  const estimateTokens = (text: string) => Math.ceil((text?.length ?? 0) / 4);
  const promptText = userQuery
    ? `User Query: ${userQuery}`
    : `Format the results for SQL query: ${sqlQuery}`;
  const estimatedUsage = !agentResponse.usage
    ? {
        inputTokens: estimateTokens(promptText),
        outputTokens: estimateTokens(agentResponse.text ?? ''),
        totalTokens: estimateTokens(promptText) + estimateTokens(agentResponse.text ?? ''),
      }
    : undefined;
  let result: FormattedResults;
  try {
    // Parse the agent response as JSON
    let responseText = agentResponse.text.trim();

    // Remove any markdown code blocks if present
    responseText = responseText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // Handle common JSON parsing issues
    let parsedResponse = {} as FormattedResults;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      // Try to fix common JSON issues and parse again
      try {
        // Handle unescaped quotes in strings
        const fixedJson = responseText.replace(/([^\\])"(?=[^"]*"?[^\]]*$)/g, '$1\\"');
        // Handle trailing commas
        const fixedTrailingCommas = fixedJson.replace(/,\s*([}\]])/g, '$1');
        parsedResponse = JSON.parse(fixedTrailingCommas);
      } catch {
        // If still can't parse, try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          try {
            parsedResponse = JSON.parse(responseText.replace(/\\/g, '\\\\'));
          } catch (e) {
            throw new Error(`Failed to parse JSON response: ${e.message}`);
          }
        }
      }
    }

    console.log('🚀 > parsedResponse:', parsedResponse);

    // Ensure required fields exist with fallbacks
    result = {
      visualizationType: parsedResponse.visualizationType || 'table',
      formattedData: parsedResponse.formattedData || queryResults,
      summary: parsedResponse.summary || `Query returned ${queryResults.length} records`,
      usage: agentResponse.usage
        ? {
            inputTokens: agentResponse.usage.inputTokens ?? 0,
            outputTokens: agentResponse.usage.outputTokens ?? 0,
            totalTokens: agentResponse.usage.totalTokens ?? 0,
          }
        : estimatedUsage,
    };
  } catch (error) {
    console.error('error:', error);
    // Fallback to table format if parsing fails
    result = {
      visualizationType: 'table',
      formattedData: queryResults, // Return the raw query results as-is
      summary: `Query returned ${queryResults.length} records`,
      usage: agentResponse.usage
        ? {
            inputTokens: agentResponse.usage.inputTokens ?? 0,
            outputTokens: agentResponse.usage.outputTokens ?? 0,
            totalTokens: agentResponse.usage.totalTokens ?? 0,
          }
        : estimatedUsage,
    };
  }

  // Validate the response has required fields
  if (!result.visualizationType || !result.formattedData || !result.summary) {
    // Provide fallback response
    return {
      visualizationType: 'table' as const,
      formattedData: queryResults, // Return the raw query results as-is
      summary: `Query returned ${queryResults.length} records`,
      usage: agentResponse.usage
        ? {
            inputTokens: agentResponse.usage.inputTokens ?? 0,
            outputTokens: agentResponse.usage.outputTokens ?? 0,
            totalTokens: agentResponse.usage.totalTokens ?? 0,
          }
        : estimatedUsage,
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
