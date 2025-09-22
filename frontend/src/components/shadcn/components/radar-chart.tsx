'use client';

import { Card, CardBody } from '@heroui/react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
} from 'recharts';
import type { ChartData } from 'recharts/types/state/chartDataSlice';
import { ChartContainer, ChartTooltip } from './chart';
import { CustomTooltipContent } from './custom-tooltip-content';

export interface RadarChartConfig
  extends Record<
    string,
    {
      label: string;
      color: string;
      fillOpacity?: number;
    }
  > {}

interface RadarChartProps {
  data: ChartData;
  config: RadarChartConfig;
  angleAxisKey: string;
  className?: string;
  outerRadius?: number | string;
  gridStrokeOpacity?: number;
  showPolarRadiusAxis?: boolean;
}

export function RadarChart({
  data,
  config,
  angleAxisKey,
  className = 'mx-auto aspect-square max-h-[250px]',
  outerRadius = '80%',
  gridStrokeOpacity = 0.3,
  showPolarRadiusAxis = false,
}: RadarChartProps) {
  const dataKeys = Object.keys(config);

  return (
    <Card>
      <CardBody className="pb-0">
        <ChartContainer config={config} className={className}>
          <RechartsRadarChart
            outerRadius={outerRadius}
            data={data}
            margin={{
              top: 5,
              right: 20,
              left: 20,
              bottom: 5,
            }}
          >
            <ChartTooltip cursor={false} content={<CustomTooltipContent />} />
            <PolarGrid gridType="circle" strokeOpacity={gridStrokeOpacity} strokeDasharray="3 3" />
            <PolarAngleAxis dataKey={angleAxisKey} />
            {showPolarRadiusAxis && <PolarRadiusAxis angle={30} />}
            {dataKeys.map((dataKey) => {
              const { color, fillOpacity = 0.1 } = config[dataKey];
              return (
                <Radar
                  key={dataKey}
                  name={config[dataKey]?.label || dataKey}
                  dataKey={dataKey}
                  stroke={color}
                  fill={color}
                  fillOpacity={fillOpacity}
                  dot={{ fill: color, strokeWidth: 1, r: 4 }}
                  activeDot={{ fill: color, stroke: '#fff', strokeWidth: 2, r: 6 }}
                />
              );
            })}
          </RechartsRadarChart>
        </ChartContainer>
      </CardBody>
    </Card>
  );
}
