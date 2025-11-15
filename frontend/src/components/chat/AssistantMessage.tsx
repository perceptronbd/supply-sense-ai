'use client';

import { useLLMOutput } from '@llm-ui/react';
import { CHART_TYPES_VALUES, type TChartType } from '@supplysense/constant';
import type { ChatMessageResponse } from '@/store/api/chatApi';
import { RenderChart } from './RenderChart';
import { RenderTable } from './RenderTable';

interface AssistantMessageProps {
  blockMatches: ReturnType<typeof useLLMOutput>['blockMatches'];
  message: ChatMessageResponse;
}

export function AssistantMessage({ blockMatches, message }: Readonly<AssistantMessageProps>) {
  return (
    <article className="overflow-x-auto chat-markdown w-full text-foreground ">
      {blockMatches.map((blockMatch, index) => {
        const Component = blockMatch.block.component;
        return (
          <Component
            key={`block-${index}-${blockMatch.output.slice(0, 20).replace(/\s/g, '')}`}
            blockMatch={blockMatch}
          />
        );
      })}

      {/* Render structured data like tables or charts */}
      {message.structuredData?.visualizationType === 'table' && (
        <RenderTable
          data={message.structuredData?.formattedData as Record<string, string>[]}
          className="mt-4"
        />
      )}
      {message.structuredData?.visualizationType &&
        CHART_TYPES_VALUES.includes(message.structuredData?.visualizationType as TChartType) && (
          <RenderChart
            data={message.structuredData?.formattedData as Record<string, string>[]}
            chartType={message.structuredData?.visualizationType as TChartType}
          />
        )}
      {message.structuredData?.visualizationType === 'text' &&
        typeof message.structuredData?.formattedData === 'string' && (
          <p>{message.structuredData?.formattedData as string}</p>
        )}
    </article>
  );
}
