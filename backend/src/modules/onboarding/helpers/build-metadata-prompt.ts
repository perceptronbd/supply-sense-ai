export const buildMultipleTablesMetadataPrompt = () => {
  const systemPrompt = [
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

  return {
    systemPrompt,
  };
};
