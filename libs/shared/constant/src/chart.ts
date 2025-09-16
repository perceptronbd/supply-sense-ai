export const CHART_TYPES = {
  BAR: 'bar',
  AREA: 'area',
  LINE: 'line',
  RADAR: 'radar',
  PIE: 'pie',
} as const;

export const CHART_TYPES_VALUES = Object.values(CHART_TYPES);

export type TChartType = (typeof CHART_TYPES)[keyof typeof CHART_TYPES];
