export const ANALYZE_METADATA_TOOL = {
  NAME: 'analyze-table-metadata',
  DESCRIPTION:
    'Analyze database table schema and generate intelligent metadata including friendly labels, purpose, update frequency, data sensitivity, and sample questions',
} as const;

export const METADATA_UPDATE_FREQUENCIES = [
  'real-time',
  'daily',
  'weekly',
  'monthly',
  'rarely',
] as const;

export type TMetadataUpdateFrequency = (typeof METADATA_UPDATE_FREQUENCIES)[number];
