'use client';
import { CHART_TYPES, type TChartType } from '@supplysense/constant';
import { AnimatedHighlightedAreaChart } from '../shadcn/components/area-chart';
import { type BarChartConfig, HatchedBarMultipleChart } from '../shadcn/components/bar-chart';
import { DottedMultiLineChart } from '../shadcn/components/line-chart';
import { RadarChart, type RadarChartConfig } from '../shadcn/components/radar-chart';

// Define chart colors for different data series
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

// Function to generate chart configuration from data
const generateChartConfig = (
  data: Record<string, string | number>[]
): { config: BarChartConfig; xAxisKey: string } => {
  if (!data || data.length === 0) {
    return { config: {}, xAxisKey: '' };
  }

  // Find all keys in the first data point that aren't the x-axis (assumed to be the first key)
  const firstItem = data[0];
  const keys = Object.keys(firstItem);
  const xAxisKey = keys[0]; // Assume first key is the x-axis
  const valueKeys = keys.slice(1); // All other keys are data series

  // Create config for each data series
  const config: BarChartConfig = {};
  valueKeys.forEach((key, index) => {
    config[key] = {
      label: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize first letter
      color: CHART_COLORS[index % CHART_COLORS.length],
      isHatched: index > 0, // Hatch all but the first series
    };
  });

  return { config, xAxisKey };
};

interface RenderChartProps {
  data: Record<string, string | number>[];
  chartType: TChartType;
  dashedLines?: string[];
  showDots?: boolean;
  angleAxisKey?: string; // Optional override for radar chart angle axis key
}

export const RenderChart = ({
  data,
  chartType,
  dashedLines = [],
  showDots = true,
  angleAxisKey,
}: RenderChartProps) => {
  // Generate chart configuration from data
  const { config: chartConfig, xAxisKey } = generateChartConfig(data);
  // Chart configuration based on type
  const renderChart = () => {
    if (!data || data.length === 0) {
      return <div>No data available</div>;
    }

    switch (chartType) {
      case CHART_TYPES.RADAR:
        return (
          <RadarChart
            data={data}
            config={chartConfig as unknown as RadarChartConfig}
            angleAxisKey={angleAxisKey || xAxisKey}
            className="w-full h-full"
          />
        );

      case CHART_TYPES.LINE:
        return (
          <DottedMultiLineChart
            data={data}
            config={chartConfig}
            xAxisKey={xAxisKey}
            height={300}
            className="w-full"
            dashedLines={dashedLines}
            showDots={showDots}
          />
        );
      case CHART_TYPES.AREA:
        return (
          <AnimatedHighlightedAreaChart
            data={data}
            config={chartConfig}
            xAxisKey={xAxisKey}
            height={300}
            className="w-full"
          />
        );
      default:
        return <HatchedBarMultipleChart data={data} config={chartConfig} xAxisKey={xAxisKey} />;
    }
  };

  return <section className="w-full mt-10">{renderChart()}</section>;
};
