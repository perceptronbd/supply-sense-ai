import type { ITableSchemaInput } from '@supplysense/types';

export const buildMultipleTablesMetadataPrompt = (
  tables: Array<{ tableName: string; tableSchema: ITableSchemaInput }>,
  businessContext?: string
): string => {
  const tablesInfo = tables
    .map(
      ({ tableName, tableSchema }) => `
Table Name: "${tableName}"
Table Schema:
${JSON.stringify(tableSchema, null, 2)}
`
    )
    .join('\n---\n');

  return [
    'You are an expert data analyst. Your task is to analyze the following database tables and generate structured metadata for each one.',
    '',
    'Tables to analyze:',
    tablesInfo,
    businessContext ? `Business Context: ${businessContext}` : '',
    '',
    'CRITICAL INSTRUCTIONS FOR UNIQUE RESPONSES:',
    '1. Each table MUST have a completely different and unique response',
    '2. Analyze the SPECIFIC column names, data types, and relationships for each table',
    '3. DO NOT use generic templates or similar patterns across tables',
    "4. The friendlyLabel should reflect the table's actual purpose based on its columns",
    '5. The purpose should be specific to what THIS table does based on its schema structure',
    '6. Sample questions MUST reference actual column names from each specific table',
    '7. Consider foreign key relationships and primary keys when generating purpose and questions',
    '8. Each table should have completely different sample questions that cannot be applied to other tables',
    '9. Avoid generic phrases like "manage data" or "store information" - be specific about WHAT data and WHY',
    '',
    'Please provide the metadata as a JSON array where each object contains these fields:',
    '[',
    '  {',
    '    "tableName": string, // The table\'s name',
    '    "friendlyLabel": string, // A human-readable label for the table (unique and specific to its columns)',
    '    "purpose": string, // What this table is used for based on its specific column structure (2-3 sentences)',
    '    "updateFrequency": "real-time" | "daily" | "weekly" | "monthly" | "rarely", // How often data changes',
    '    "sampleQuestions": string[] // 3-5 business questions that reference ACTUAL column names from this specific table',
    '  }',
    ']',
    '',
    'IMPORTANT: Each table must have completely different and unique metadata. No two tables should have similar purposes or sample questions.',
    'Return only the JSON array, no additional text or formatting.',
  ].join('\n');
};
