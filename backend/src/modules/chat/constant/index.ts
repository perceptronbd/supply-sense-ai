export const VISUALIZATION_TYPE = {
  TABLE: 'table',
  BAR: 'bar',
  PIE: 'pie',
  LINE: 'line',
  DOUGHNUT: 'doughnut',
  TEXT: 'text',
} as const;

export type VisualizationType = (typeof VISUALIZATION_TYPE)[keyof typeof VISUALIZATION_TYPE];
