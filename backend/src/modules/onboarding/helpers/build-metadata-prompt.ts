import type { ITableSchemaInput } from '@supplysense/types';

interface IBuildMetadataPrompt {
  tableName: string;
  tableSchema: ITableSchemaInput;
  toolInput: {
    tableName: string;
    tableSchema: ITableSchemaInput;
    businessContext: string;
  };
  businessContext?: string;
}

export const buildMetadataPrompt = ({
  tableName,
  tableSchema,
  toolInput,
  businessContext,
}: IBuildMetadataPrompt): string => {
  return [
    'You are an expert data analyst. Your task is to analyze the following database table and generate structured metadata for it.',
    '',
    `Table Name: "${tableName}"`,
    'Table Schema:',
    JSON.stringify(tableSchema, null, 2),
    businessContext ? `Business Context: ${businessContext}` : '',
    '',
    'Please provide the following metadata as a JSON object with these fields:',
    '{',
    '  "tableName": string, // The table\'s name',
    '  "friendlyLabel": string, // A human-friendly label for the table',
    '  "purpose": string, // A concise business purpose for this table (do not use asterisks or markdown)',
    '  "updateFrequency": string, // One of: "real-time", "daily", "weekly", "monthly", "rarely"',
    '  "sampleQuestions": string[] // 5-8 diverse, creative sample questions users might ask about this data',
    '}',
    '',
    'Use the analyze-table-metadata tool with this input:',
    JSON.stringify(toolInput, null, 2),
    '',
    'Important:',
    '- Do NOT use markdown or asterisks in any field values.',
    '- Make sure the JSON is valid and all fields are present.',
    '- Sample questions should be unique, relevant, and phrased as natural questions.',
    '- The purpose should be a single, clear sentence.',
  ]
    .filter(Boolean)
    .join('\n');
};
