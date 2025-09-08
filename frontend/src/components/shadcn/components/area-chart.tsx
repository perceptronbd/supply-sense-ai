'use client';

import { Card, CardBody } from '@heroui/react';
import React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from './chart';

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
  xAxisKey,
  height = 300,
  className = '',
  xAxisFormatter = (value) => String(value).slice(0, 3),
}: AnimatedHighlightedAreaChartProps) {
  const [xAxis, setXAxis] = React.useState<number | null>(null);
  const dataKeys = Object.keys(config);

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
            onMouseMove={(e) => setXAxis(e.chartX as number)}
            onMouseLeave={() => setXAxis(null)}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
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
