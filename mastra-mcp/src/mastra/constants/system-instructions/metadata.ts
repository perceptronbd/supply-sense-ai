export const TABLE_METADATA_AGENT_NAME = 'Table Metadata Analyst';
export const TABLE_METADATA_AGENT_DESCRIPTION =
  'AI agent specialized in analyzing database schema and generating intelligent metadata for tables based on actual column structure and data patterns';

export const TABLE_METADATA_AGENT_INSTRUCTIONS = [
  ' Your task is to analyze the following database tables and generate structured metadata for each one.',
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
].join('\n');

export const ANALYZE_METADATA_TOOL = {
  NAME: 'analyze-table-metadata',
  DESCRIPTION:
    'Analyze database table schema and generate intelligent metadata including friendly labels, purpose, update frequency, data sensitivity, and sample questions',
} as const;
