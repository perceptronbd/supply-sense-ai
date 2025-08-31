import { createTool } from '@mastra/core';
import { z } from 'zod';
import { formattingAgent } from '../agents/formatting-agent';
import { FORMAT_RESULTS_TOOL } from '../constants/system-instructions/result-formatting';

// Chart.js TypeScript interfaces for proper type safety
interface ChartDataset {
  label: string;
  data: number[];
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

// Union type for different data formats
// Support flexible array of objects for table data, preserving original query structure
type FormattedData = ChartData | Record<string, unknown>[] | string;

type FormattedResults = {
  visualizationType: 'table' | 'bar' | 'pie' | 'line' | 'doughnut' | 'text';
  formattedData: FormattedData;
  summary: string;
};

const inputSchema = z.object({
  queryResults: z.array(z.record(z.unknown())),
  sqlQuery: z.string(),
  userQuery: z.string().optional(),
});

const outputSchema = z.object({
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
  // Analyze the query results to determine visualization format
  const agentResponse = await formattingAgent.generate([
    {
      role: 'system',
      content: `You are a data visualization expert who determines the best way to present query results.

Analyze the provided data and determine the optimal visualization format.

CRITICAL RESPONSE FORMAT:
You MUST respond with a valid JSON object containing exactly these fields:
{
  "visualizationType": "table|bar|pie|line|doughnut|text",
  "formattedData": <Chart.js compatible data or structured data>,
  "summary": "Brief description of the data"
}

VISUALIZATION RULES:
1. **Text**: Single values, counts, simple summaries (e.g., "Total count: 5")
2. **Table**: Complex data with multiple columns, detailed records
3. **Bar Chart**: Comparing categories, counts across groups
4. **Pie Chart**: Parts of whole, percentages (max 7 categories)
5. **Line Chart**: Time series, trends over dates/periods
6. **Doughnut Chart**: Similar to pie but better for multiple series

FOR TABLE DATA - FLEXIBLE FORMAT REQUIREMENT:
When visualizationType is "table", the formattedData should be an array of objects that preserves the original data structure from the query results. The format should be flexible to accommodate any database schema:
[
  {
    "field1": "value1",
    "field2": "value2",
    "field3": number,
    "field4": "value4"
    // ... any additional fields from the query
  }
]

The tool should preserve all columns and data from the original query results without forcing a specific structure.



Query Results: ${JSON.stringify(queryResults, null, 2)}
SQL Query: ${sqlQuery}
${userQuery ? `User Query: ${userQuery}` : ''}

Return ONLY the JSON response without any markdown formatting or explanations.`,
    },
    {
      role: 'user',
      content: `Analyze this data and determine the best visualization format: ${JSON.stringify(queryResults, null, 2)}`,
    },
  ]);

  let result: FormattedResults;
  try {
    // Parse the agent response as JSON
    const responseText = agentResponse.text.trim();
    // Remove any markdown code blocks if present
    const cleanedResponse = responseText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    result = JSON.parse(cleanedResponse);
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
  execute: async (input): Promise<FormattedResults> => {
    const { queryResults, sqlQuery, userQuery } = input.context;

    // Call the extracted formatting function
    return await formatQueryResults(queryResults, sqlQuery, userQuery);
  },
});
