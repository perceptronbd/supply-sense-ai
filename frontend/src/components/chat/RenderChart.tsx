'use client';

import type { ChartData } from 'recharts/types/state/chartDataSlice';
import { HatchedBarMultipleChart } from '../shadcn/components/bar-chart';

interface RenderChartProps {
  data: ChartData;
  chartType: 'bar' | 'pie' | 'line' | 'doughnut';
}

export const RenderChart = ({ data, chartType }: RenderChartProps) => {
  // Chart configuration based on type
  const renderChart = () => {
    switch (chartType) {
      // case 'pie':
      //   return <Pie data={chartData} options={options} />;
      // case 'doughnut':
      //   return <Doughnut data={chartData} options={options} />;
      // case 'line':
      //   // For line charts, we might want to adjust the data structure for better visualization
      //   return <Line data={chartData} options={options} />;
      default:
        return <HatchedBarMultipleChart data={data} />;
    }
  };

  return <div className="w-full h-80">{renderChart()}</div>;
};
