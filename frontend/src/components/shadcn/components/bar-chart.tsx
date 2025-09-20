'use client';

import { Bar, BarChart } from 'recharts';

import { Card, CardBody } from '@heroui/react';
import type { ChartData } from 'recharts/types/state/chartDataSlice';
import { ChartContainer, ChartTooltip } from './chart';

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
}

export const HatchedBarMultipleChart = ({ data, config }: HatchedBarMultipleChartProps) => {
  return (
    <Card>
      <CardBody>
        <ChartContainer config={config}>
          <BarChart accessibilityLayer data={data}>
            <rect
              x="0"
              y="0"
              width="100%"
              height="85%"
              fill="url(#default-multiple-pattern-dots)"
            />
            <defs>
              <DottedBackgroundPattern />
            </defs>
            <ChartTooltip cursor={false} content={<CustomTooltipContent />} />
            {Object.entries(config).map(([dataKey, { color, isHatched = true }]) => (
              <Bar
                key={dataKey}
                dataKey={dataKey}
                fill={color}
                shape={<CustomHatchedBar isHatched={true} dataKey={dataKey} />}
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
}

const CustomHatchedBar = ({
  fill,
  x,
  y,
  width,
  height,
  dataKey,
  isHatched = true,
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
        fill={isHatched ? `url(#hatched-bar-pattern-${dataKey})` : fill}
      />
      <defs>
        <pattern
          key={dataKey}
          id={`hatched-bar-pattern-${dataKey}`}
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
const DottedBackgroundPattern = () => {
  return (
    <pattern
      id="default-multiple-pattern-dots"
      x="0"
      y="0"
      width="10"
      height="10"
      patternUnits="userSpaceOnUse"
    >
      <circle className="dark:text-muted/40 text-muted" cx="2" cy="2" r="1" fill="currentColor" />
    </pattern>
  );
};

export const CustomTooltipContent = ({ active, payload }: any) => {
  if (!active || !payload?.length) {
    return null;
  }

  const data = payload[0]?.payload;

  if (!data) {
    return null;
  }

  return (
    <div className="border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
      <div className="grid gap-1">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center gap-4">
            <span className="text-muted-foreground text-xs font-medium">{key}:</span>
            <span className="text-foreground font-mono font-medium tabular-nums text-xs">
              {String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
