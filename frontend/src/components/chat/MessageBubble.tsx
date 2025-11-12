'use client';

import { Button, Card, CardBody } from '@heroui/react';
import { codeBlockLookBack, findCompleteCodeBlock, findPartialCodeBlock } from '@llm-ui/code';
import { markdownLookBack } from '@llm-ui/markdown';
import { useLLMOutput } from '@llm-ui/react';
import { format, isToday, isValid, isYesterday } from 'date-fns';
import { LogoIcon } from '@/components/icons/LogoIcon';
import { Text } from '@/components/ui/Text';
import type { ChatMessageResponse } from '@/store/api/chatApi';
import LLMCodeBlockComponent from './LLMCodeBlockComponent';
import LLMMarkdownComponent from './LLMMarkdownComponent';
import './markdown.css';
import { CHART_TYPES_VALUES, type TChartType } from '@supplysense/constant';
import { useState } from 'react';
import { Icons } from '@/lib/icons/Icons';
import BlinkingLogo from '../ui/animations/BlinkingLogo';
import { RenderChart } from './RenderChart';
import { RenderTable } from './RenderTable';

interface MessageBubbleProps {
  message: ChatMessageResponse;
  onSuggestionClick?: (suggestion: string) => void;
}

export function MessageBubble({ message, onSuggestionClick: _ }: MessageBubbleProps) {
  const isUser = message.type === 'user';
  const [copied, setCopied] = useState(false);

  // Use llm-ui for AI message rendering
  const { blockMatches } = useLLMOutput({
    llmOutput: message.content,
    fallbackBlock: {
      component: LLMMarkdownComponent,
      lookBack: markdownLookBack(),
    },
    blocks: [
      {
        component: LLMCodeBlockComponent,
        findCompleteMatch: findCompleteCodeBlock(),
        findPartialMatch: findPartialCodeBlock(),
        lookBack: codeBlockLookBack(),
      },
    ],
    isStreamFinished: true, // Message is complete
  });

  // Format timestamp for assistant messages (e.g., "Sun at 12:30 AM")
  const getFormattedTime = (dateString?: string) => {
    if (!dateString) return 'now';
    const date = new Date(dateString);
    if (!isValid(date)) return 'now';
    try {
      if (isToday(date)) return format(date, "'Today at' h:mm a");
      if (isYesterday(date)) return format(date, "'Yesterday at' h:mm a");
      return format(date, "EEE 'at' h:mm a");
    } catch {
      return 'now';
    }
  };

  const timestamp = getFormattedTime(message.createdAt);

  // Copy message to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message: ', err);
    }
  };

  return (
    <article
      className={`flex gap-3 w-full overflow-x-clip ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}
      aria-label={`${isUser ? 'User' : 'AI Assistant'} message at ${timestamp}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0">
          <LogoIcon size={36} className="text-primary" />
        </div>
      )}

      {/* Message content */}
      <div className={` ${isUser ? 'items-end' : 'items-start'} flex flex-col flex-1`}>
        {isUser ? (
          <Card shadow="none" className="bg-default-300 text-primary-foreground w-fit max-w-md">
            <CardBody className="overflow-x-clip p-3 min-w-0">
              {isUser && (
                <Text variant="bodySmall" color="inverse" className="whitespace-pre-wrap">
                  {message.content}
                </Text>
              )}
            </CardBody>
          </Card>
        ) : (
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
            {/* <RenderChart data={chartData} chartType="area" /> */}
            {message.structuredData?.visualizationType === 'table' && (
              <RenderTable
                data={message.structuredData?.formattedData as Record<string, string>[]}
                className="mt-4"
              />
            )}
            {message.structuredData?.visualizationType &&
              CHART_TYPES_VALUES.includes(
                message.structuredData?.visualizationType as TChartType
              ) && (
                <RenderChart
                  data={message.structuredData?.formattedData as Record<string, string>[]}
                  chartType={message.structuredData?.visualizationType as TChartType}
                  // chartType='radar'
                />
              )}
            {message.structuredData?.visualizationType === 'text' &&
              typeof message.structuredData?.formattedData === 'string' && (
                <p>{message.structuredData?.formattedData as string}</p>
              )}
          </article>
        )}

        {/* Action buttons and timestamp for assistant messages */}
        {!isUser && (
          <div className="flex items-center justify-between w-full mt-2 gap-2">
            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                aria-label={copied ? 'Copied' : 'Copy message'}
                onPress={copyToClipboard}
              >
                {copied ? <Icons.Check /> : <Icons.Copy />}
              </Button>
              <Button isIconOnly variant="light" size="sm" aria-label="Like message">
                <Icons.ThumbsUp />
              </Button>
              <Button isIconOnly variant="light" size="sm" aria-label="Dislike message">
                <Icons.ThumbsDown />
              </Button>
              <Button isIconOnly variant="light" size="sm" aria-label="Regenerate message">
                <Icons.RefreshCw />
              </Button>
            </div>

            {/* Timestamp */}
            <Text
              variant="bodyXSmall"
              className="text-default-500 text-right flex-shrink-0"
              as="time"
            >
              {timestamp}
            </Text>
          </div>
        )}
      </div>
    </article>
  );
}

// Loading message component
export function LoadingMessage() {
  return (
    <article className="flex gap-3 mb-4" aria-label="AI is processing your request">
      <BlinkingLogo floating={false} size={36} />
      <Text variant="bodyMedium" color="muted" as="span">
        AI is thinking...
      </Text>
    </article>
  );
}
