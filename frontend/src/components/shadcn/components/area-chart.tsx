'use client';

import { Card, CardBody } from '@heroui/react';
import React from 'react';
import { Area, AreaChart, CartesianGrid } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip } from './chart';
import { CustomTooltipContent } from './custom-tooltip-content';

// Animation configuration
const ANIMATION_CONFIG = {
  glowWidth: 300,
} as const;

interface AnimatedHighlightedAreaChartProps {
  data: Array<Record<string, string | number>>;
  config: ChartConfig;
  xAxisKey: string;
  height?: number | string;
  className?: string;
  xAxisFormatter?: (value: string) => string;
}

export function AnimatedHighlightedAreaChart({
  data,
  config,
  height = 300,
  className = '',
}: AnimatedHighlightedAreaChartProps) {
  const [xAxis, setXAxis] = React.useState<number | null>(null);
  console.log('🚀 > xAxis:', xAxis);
  const dataKeys = Object.keys(config);

  // Validate data structure for area chart
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardBody>
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No data available</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Check if data has multiple numeric series (required for area chart)
  const hasMultipleNumericSeries =
    dataKeys.length > 1 ||
    (dataKeys.length === 1 && data.every((item) => typeof item[dataKeys[0]] === 'number'));

  if (!hasMultipleNumericSeries) {
    return (
      <Card className={className}>
        <CardBody>
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">
              Area chart requires multiple numeric data series
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card
      className={className}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <CardBody className="h-full">
        <ChartContainer config={config} className="h-full">
          <AreaChart
            accessibilityLayer
            data={data}
            onMouseMove={(e) => {
              console.log('🚀 > e:', e);
              setXAxis((e.activeCoordinate as { x: number; y: number })?.x);
            }}
            onMouseLeave={() => setXAxis(null)}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            className="h-full"
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />

            <ChartTooltip cursor={false} content={<CustomTooltipContent />} />
            <defs>
              <linearGradient id="animated-highlighted-mask-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="white" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
              {dataKeys.map((key) => (
                <linearGradient
                  key={`gradient-${key}`}
                  id={`animated-highlighted-grad-${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={0} />
                </linearGradient>
              ))}
              {xAxis && (
                <mask id="animated-highlighted-mask">
                  <rect
                    x={xAxis - ANIMATION_CONFIG.glowWidth / 2}
                    y={0}
                    width={ANIMATION_CONFIG.glowWidth}
                    height="100%"
                    fill="url(#animated-highlighted-mask-grad)"
                  />
                </mask>
              )}
            </defs>
            {dataKeys.map((key) => (
              <Area
                key={key}
                dataKey={key}
                type="natural"
                fill={`url(#animated-highlighted-grad-${key})`}
                fillOpacity={0.4}
                stroke={`var(--color-${key})`}
                stackId="a"
                strokeWidth={0.8}
                mask="url(#animated-highlighted-mask)"
                activeDot={{
                  r: 4,
                  fill: `var(--color-${key})`,
                  stroke: 'var(--background)',
                  strokeWidth: 2,
                }}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardBody>
    </Card>
  );
}
