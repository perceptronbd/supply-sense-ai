'use client';

import { UserIcon } from '@/components/icons';
import { LogoIcon } from '@/components/icons/LogoIcon';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { Text } from '@/components/ui/Text';
import type { ChatMessage } from '@/store/api/chatApi';
import { Avatar, Card, CardBody } from '@heroui/react';
import { codeBlockLookBack, findCompleteCodeBlock, findPartialCodeBlock } from '@llm-ui/code';
import { markdownLookBack } from '@llm-ui/markdown';
import { useLLMOutput } from '@llm-ui/react';
import { format } from 'date-fns';
import LLMCodeBlockComponent from './LLMCodeBlockComponent';
import LLMMarkdownComponent from './LLMMarkdownComponent';
import './markdown.css';
import { RenderChart } from './RenderChart';
interface MessageBubbleProps {
  message: ChatMessage;
  onSuggestionClick?: (suggestion: string) => void;
}

export function MessageBubble({ message, onSuggestionClick }: MessageBubbleProps) {
  console.log('🚀 onSuggestionClick:', onSuggestionClick);
  const isUser = message.type === 'user';

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

  // Safe date formatting with fallback
  const getFormattedTime = (dateString: string | undefined) => {
    if (!dateString) return 'now';

    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) {
        return 'now';
      }
      return format(date, 'HH:mm');
    } catch (_error) {
      console.warn('Invalid date format:', dateString);
      return 'now';
    }
  };

  const timestamp = getFormattedTime(message.createdAt);

  const chartData = [
    { month: 'January', netSales: 186, profit: 80 },
    { month: 'February', netSales: 305, profit: 200 },
    { month: 'March', netSales: 237, profit: 120 },
    { month: 'April', netSales: 73, profit: 190 },
    { month: 'May', netSales: 209, profit: 130 },
    { month: 'June', netSales: 214, profit: 140 },
  ];

  // const tableData = [
  //   {
  //     id: '35cf4c05-ee4a-4ae9-9539-4ada8cbc2cd8',
  //     name: 'Raw Material A - Premium Grade',
  //     sku: 'RM001-62a7',
  //     quantity: 62,
  //     availableQty: 62,
  //   },
  //   {
  //     id: 'cfd5fa58-75a5-4950-864e-dae54c7860f4',
  //     name: 'Finished Product Alpha',
  //     sku: 'FG001-62a7',
  //     quantity: 45,
  //     availableQty: 45,
  //   },
  //   {
  //     id: 'cfd5fa58-75a5-4950-864e-dae54c7860f4',
  //     name: 'Finished Product Alpha',
  //     sku: 'FG001-62a7',
  //     quantity: 50,
  //     availableQty: 50,
  //   },
  //   {
  //     id: 'b36b2106-5d11-4953-b255-3f11bf624024',
  //     name: 'Chemical Component X',
  //     sku: 'RM003-62A7',
  //     quantity: 92,
  //     availableQty: 92,
  //   },
  //   {
  //     id: 'cfd5fa58-75a5-4950-864e-dae54c7860f4',
  //     name: 'Finished Product Alpha',
  //     sku: 'FG001-62a7',
  //     quantity: 33,
  //     availableQty: 33,
  //   },
  //   {
  //     id: '7b37ac4d-6937-4ce7-9447-deecc386f4e1',
  //     name: 'Finished Product Alpha',
  //     sku: 'FG001-28fe',
  //     quantity: 20,
  //     availableQty: 20,
  //   },
  //   {
  //     id: '116c5020-95b2-4511-b37f-bc1e23b43ac3',
  //     name: 'Raw Material A - Premium Grade',
  //     sku: 'RM001-28fe',
  //     quantity: 98,
  //     availableQty: 98,
  //   },
  //   {
  //     id: '82806843-ccc9-4c20-b0da-b1c0513b5d07',
  //     name: 'Raw Material B - Standard Grade',
  //     sku: 'RM002-28fe',
  //     quantity: 54,
  //     availableQty: 54,
  //   },
  //   {
  //     id: '7b37ac4d-6937-4ce7-9447-deecc386f4e1',
  //     name: 'Finished Product Alpha',
  //     sku: 'FG001-28fe',
  //     quantity: 52,
  //     availableQty: 52,
  //   },
  //   {
  //     id: '6d6a68e0-c706-413c-8d98-f5c0121ca572',
  //     name: 'Chemical Component X',
  //     sku: 'RM003-28fe',
  //     quantity: 86,
  //     availableQty: 86,
  //   },
  //   {
  //     id: '7b37ac4d-6937-4ce7-9447-deecc386f4e1',
  //     name: 'Finished Product Alpha',
  //     sku: 'FG001-28fe',
  //     quantity: 16,
  //     availableQty: 16,
  //   },
  // ];

  return (
    <article
      className={`flex gap-3 w-full ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}
      aria-label={`${isUser ? 'User' : 'AI Assistant'} message at ${timestamp}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar
          icon={
            isUser ? (
              <UserIcon className="w-5 h-5" />
            ) : (
              <LogoIcon size={14} className="text-primary" />
            )
          }
          classNames={{
            base: 'w-8 h-8 min-w-8',
            icon: isUser ? 'text-primary-foreground' : 'text-secondary-foreground',
          }}
          color={isUser ? 'primary' : 'default'}
          size="sm"
        />
      </div>{' '}
      {/* Message content */}
      <div
        className={`flex-1 max-w-[min(80%,800px)] min-w-0 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}
      >
        {isUser ? (
          <Card className="bg-primary text-primary-foreground w-full">
            <CardBody className="overflow-x-auto p-3 min-w-0">
              {isUser && (
                <Text variant="bodyMedium" color="inverse" className="whitespace-pre-wrap">
                  {message.content}
                </Text>
              )}
              {/* {!isUser &&
            message.metadata &&
            message.metadata.suggestions &&
            Array.isArray(message.metadata.suggestions) ? (
              <section
                className="p-3 mt-3 border bg-primary/5 border-primary/20 rounded-medium"
                aria-label="Suggested follow-up questions"
              >
                <div className="flex gap-2 items-center mb-2">
                  <LogoIcon size={14} className="text-primary" />
                  <Text variant="bodySmall" color="primary" weight="medium" as="h4">
                    Suggested follow-up questions:
                  </Text>
                </div>
                <ul className="space-y-1">
                  {message.metadata.suggestions.map((suggestion: string, index: number) => (
                    <li key={`suggestion-${index}-${suggestion.slice(0, 20)}`}>
                      <Button
as ShadcnButton                        variant="light"
                        size="sm"
                        className="justify-start p-2 w-full h-auto text-left text-tiny text-primary/80 hover:text-primary hover:bg-primary/10"
                        onPress={() => {
                          onSuggestionClick?.(suggestion);
                        }}
                      >
                        {suggestion}
                      </Button>as ShadcnButton
                    </li>
                  ))}
                </ul>
              </section>
            ) : null} */}
            </CardBody>
          </Card>
        ) : (
          <article className="overflow-x-auto chat-markdown text-foreground">
            {blockMatches.map((blockMatch, index) => {
              const Component = blockMatch.block.component;
              return (
                <Component
                  key={`block-${index}-${blockMatch.output.slice(0, 20).replace(/\s/g, '')}`}
                  blockMatch={blockMatch}
                />
              );
            })}
            <RenderChart data={chartData} chartType="area" />

            {/* <RenderTable data={tableData} /> */}
          </article>
        )}

        <Text
          variant="bodyXSmall"
          className={`mt-1 text-default-400 ${isUser ? 'text-right' : 'text-left'}`}
          as="time"
        >
          {timestamp}
        </Text>
      </div>
    </article>
  );
}

// Loading message component
export function LoadingMessage() {
  return (
    <article className="flex gap-3 mb-4" aria-label="AI is processing your request">
      <DrawingLogo size={24} variant="primary" speed="fast" showFill={true} />
      <Text variant="bodyMedium" color="muted" as="span">
        AI is thinking...
      </Text>
    </article>
  );
}
