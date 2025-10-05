export const METADATA_UPDATE_FREQUENCIES = [
  'real-time',
  'daily',
  'weekly',
  'monthly',
  'rarely',
] as const;

export type TMetadataUpdateFrequency = (typeof METADATA_UPDATE_FREQUENCIES)[number];
