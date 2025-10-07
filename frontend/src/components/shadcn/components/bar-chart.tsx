'use client';

import { Card, CardBody } from '@heroui/react';
import React from 'react';
import { Bar, BarChart, XAxis } from 'recharts';
import type { ChartData } from 'recharts/types/state/chartDataSlice';
import { ChartContainer, ChartTooltip } from './chart';
import { CustomTooltipContent } from './custom-tooltip-content';

export interface BarChartConfig
  extends Record<
    string,
    {
      label: string;
      color: string;
      isHatched?: boolean;
    }
  > {}

interface HatchedBarMultipleChartProps {
  data: ChartData;
  config: BarChartConfig;
  xAxisKey: string;
}

export const HatchedBarMultipleChart = ({
  data,
  config,
  xAxisKey,
}: HatchedBarMultipleChartProps) => {
  const uniqueId = React.useId();
  const backgroundPatternId = `${uniqueId}-background-dots`;
  const createPatternId = React.useCallback(
    (key: string) => `${uniqueId}-pattern-${key}`,
    [uniqueId]
  );
  return (
    <Card>
      <CardBody>
        <ChartContainer config={config}>
          <BarChart accessibilityLayer data={data}>
            <rect x="0" y="0" width="100%" height="85%" fill={`url(#${backgroundPatternId})`} />
            <defs>
              <DottedBackgroundPattern id={backgroundPatternId} />
            </defs>
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.substring(0, 5)}
            />
            <ChartTooltip cursor={false} content={<CustomTooltipContent />} />
            {Object.entries(config).map(([dataKey, { color }]) => (
              <Bar
                key={dataKey}
                dataKey={dataKey}
                fill={color}
                shape={
                  <CustomHatchedBar
                    isHatched={true}
                    dataKey={dataKey}
                    patternId={createPatternId(dataKey)}
                  />
                }
                radius={4}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardBody>
    </Card>
  );
};

interface CustomHatchedBarProps extends React.SVGProps<SVGRectElement> {
  dataKey: string;
  isHatched?: boolean;
  patternId: string;
}

const CustomHatchedBar = ({
  fill,
  x,
  y,
  width,
  height,
  dataKey,
  isHatched = true,
  patternId,
}: CustomHatchedBarProps) => {
  return (
    <>
      <rect
        rx={4}
        x={x}
        y={y}
        width={width}
        height={height}
        stroke="none"
        fill={isHatched ? `url(#${patternId})` : fill}
      />
      <defs>
        <pattern
          key={dataKey}
          id={patternId}
          x="0"
          y="0"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-45)"
        >
          <rect width="10" height="10" opacity={0.5} fill={fill} />
          <rect width="1" height="10" fill={fill} />
        </pattern>
      </defs>
    </>
  );
};
const DottedBackgroundPattern = ({ id }: { id: string }) => {
  return (
    <pattern id={id} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
      <circle className="dark:text-muted/40 text-muted" cx="2" cy="2" r="1" fill="currentColor" />
    </pattern>
  );
};
