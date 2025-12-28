'use client';

import { Card, CardBody } from '@heroui/react';
import React from 'react';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip } from './chart';
import { CustomTooltipContent } from './custom-tooltip-content';

interface CustomDotProps {
  cx?: number;
  cy?: number;
  stroke?: string;
  payload?: unknown;
  value?: unknown;
  index?: number;
}

const CustomizedDot = ({ cx, cy, stroke }: CustomDotProps) => {
  if (cx === undefined || cy === undefined) return null;
  return (
    <g>
      {/* Main dot */}
      <circle cx={cx} cy={cy} r={3} fill={stroke} />
      {/* Ping animation circles */}
      <circle cx={cx} cy={cy} r={3} stroke={stroke} fill="none" strokeWidth="1" opacity="0.8">
        <animate attributeName="r" values="3;10" dur="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0" dur="1s" repeatCount="indefinite" />
      </circle>
    </g>
  );
};

interface LineChartProps {
  data: Array<Record<string, string | number>>;
  config: ChartConfig;
  xAxisKey: string;
  title?: string;
  description?: string;
  height?: number | string;
  className?: string;
  xAxisFormatter?: (value: string) => string;
  showDots?: boolean;
  dashedLines?: string[];
  showTrendingBadge?: boolean;
  trendValue?: string;
}

export function DottedMultiLineChart({
  data,
  config,
  xAxisKey,
  height = 300,
  className = '',
  xAxisFormatter = (value) => String(value).slice(0, 5),
  showDots = false,
  dashedLines = [],
}: LineChartProps) {
  const dataKeys = Object.keys(config);
  const uniqueId = React.useId();
  const glowFilterId = `${uniqueId}-rainbow-line-glow`;

  const renderDot = (props: CustomDotProps): React.ReactElement | null => {
    const { cx, cy, stroke } = props;
    return <CustomizedDot cx={cx} cy={cy} stroke={stroke as string} />;
  };

  const defaultLineProps = {
    type: 'bump' as const,
    strokeWidth: 2,
    filter: `url(#${glowFilterId})`,
  };

  return (
    <Card className={className} style={{ height }}>
      <CardBody>
        <ChartContainer config={config} className="h-full">
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 5,
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
              height={30}
            />
            <ChartTooltip cursor={false} content={<CustomTooltipContent />} />
            {dataKeys.map((key) => (
              <Line
                key={key}
                dataKey={key}
                {...defaultLineProps}
                dot={showDots ? (renderDot as never) : false}
                activeDot={renderDot as never}
                stroke={`var(--color-${key})`}
                strokeDasharray={dashedLines.includes(key) ? '4 4' : undefined}
              />
            ))}
            <defs>
              <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="10" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
          </LineChart>
        </ChartContainer>
      </CardBody>
    </Card>
  );
}
