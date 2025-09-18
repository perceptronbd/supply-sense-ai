import { createTool } from '@mastra/core';
import { FORMATTING_SYSTEM_PROMPT, FORMAT_RESULTS_TOOL } from '@supplysense/constant';
import { z } from 'zod';
import { formattingAgent } from '../agents/formatting-agent';
import type { ChartData } from 'recharts/types/state/chartDataSlice';

// Union type for different data formats
// Support flexible array of objects for table data, preserving original query structure
type FormattedData = ChartData | Record<string, unknown>[] | string;

type FormattedResults = {
  visualizationType: 'table' | 'bar' | 'pie' | 'line' | 'doughnut' | 'text';
  formattedData: FormattedData;
  summary: string;
};

const inputSchema = z.object( {
  queryResults: z.array( z.record( z.unknown() ) ),
  sqlQuery: z.string(),
  userQuery: z.string().optional(),
} );

const outputSchema = z.object( {
  visualizationType: z.enum( ['table', 'bar', 'pie', 'line', 'doughnut', 'text'] ),
  formattedData: z.union( [
    // Recharts data structure
    z.record( z.string(), z.unknown() ),
    // Array of objects for table data (flexible format for any query results)
    z.array( z.record( z.any() ) ),
    // Simple text
    z.string(),
  ] ),
  summary: z.string(),
} );

// Export the formatting logic so it can be called directly
export async function formatQueryResults (
  queryResults: Record<string, unknown>[],
  sqlQuery: string,
  userQuery?: string
) {
  // Analyze the query results to determine visualization format
  const agentResponse = await formattingAgent.generate( [
    {
      role: 'system',
      content: FORMATTING_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: `
      Query Results: ${ JSON.stringify( queryResults, null, 2 ) }
      SQL Query: ${ sqlQuery }
      ${ userQuery ? `User Query: ${ userQuery }` : '' }

      Analyze this data and determine the best visualization format: ${ JSON.stringify( queryResults, null, 2 ) }`,
    },
  ] );

  let result: FormattedResults;
  try {
    // Parse the agent response as JSON
    const responseText = agentResponse.text.trim();
    // Remove any markdown code blocks if present
    const cleanedResponse = responseText
      .replace( /```json\s*/gi, '' )
      .replace( /```\s*/g, '' )
      .trim();

    result = JSON.parse( cleanedResponse );
  } catch ( error ) {
    console.error( 'error:', error );
    // Fallback to table format if parsing fails
    result = {
      visualizationType: 'table',
      formattedData: queryResults, // Return the raw query results as-is
      summary: `Query returned ${ queryResults.length } records`,
    };
  }

  // Validate the response has required fields
  if ( !result.visualizationType || !result.formattedData || !result.summary ) {
    // Provide fallback response
    return {
      visualizationType: 'table' as const,
      formattedData: queryResults, // Return the raw query results as-is
      summary: `Query returned ${ queryResults.length } records`,
    };
  }

  return result;
}

export const formatResultsTool = createTool( {
  id: FORMAT_RESULTS_TOOL.NAME,
  description: FORMAT_RESULTS_TOOL.DESCRIPTION,
  inputSchema,
  outputSchema,
  execute: async ( input ): Promise<FormattedResults> => {
    const { queryResults, sqlQuery, userQuery } = input.context;

    // Call the extracted formatting function
    return await formatQueryResults( queryResults, sqlQuery, userQuery );
  },
} );
