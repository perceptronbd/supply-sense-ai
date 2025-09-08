'use client';

import { Card, CardBody } from '@heroui/react';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from './chart';

interface LineChartProps {
  data: Array<Record<string, string | number>>;
  config: ChartConfig;
  xAxisKey: string;
  height?: number | string;
  className?: string;
  xAxisFormatter?: (value: string) => string;
  showDots?: boolean;
  dashedLines?: string[];
}

export function DottedMultiLineChart({
  data,
  config,
  xAxisKey,
  height = 300,
  className = '',
  xAxisFormatter = (value) => String(value).slice(0, 3),
  showDots = true,
  dashedLines = [],
}: LineChartProps) {
  const dataKeys = Object.keys(config);

  const defaultLineProps = {
    type: 'linear' as const,
    dot: showDots,
    activeDot: {
      r: 4,
      fill: 'currentColor',
      stroke: 'var(--background)',
      strokeWidth: 2,
    },
  };

  return (
    <Card
      className={className}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <CardBody className="h-full">
        <ChartContainer config={config} className="h-full">
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}
            className="h-full"
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={xAxisFormatter}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

            {dataKeys.map((key, index) => (
              <Line
                key={key}
                dataKey={key}
                {...defaultLineProps}
                stroke={`var(--color-${key})`}
                strokeDasharray={dashedLines.includes(key) || index === 0 ? '4 4' : undefined}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardBody>
    </Card>
  );
}
