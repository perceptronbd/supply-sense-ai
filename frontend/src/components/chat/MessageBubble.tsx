'use client';

import { UserIcon } from '@/components/icons';
import { LogoIcon } from '@/components/icons/LogoIcon';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { Text } from '@/components/ui/Text';
import type { ChatMessage } from '@/store/api/chatApi';
import { Avatar, Button, Card, CardBody } from '@heroui/react';
import { codeBlockLookBack, findCompleteCodeBlock, findPartialCodeBlock } from '@llm-ui/code';
import { markdownLookBack } from '@llm-ui/markdown';
import { useLLMOutput } from '@llm-ui/react';
import { format } from 'date-fns';
import LLMCodeBlockComponent from './LLMCodeBlockComponent';
import LLMMarkdownComponent from './LLMMarkdownComponent';
import './markdown.css';

interface MessageBubbleProps {
  message: ChatMessage;
  onSuggestionClick?: (suggestion: string) => void;
}

export function MessageBubble({ message, onSuggestionClick }: MessageBubbleProps) {
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
  return (
    <article
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}
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
        <Card
          className={`${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'border bg-content2 text-foreground border-divider'
          } w-full`}
        >
          <CardBody className="overflow-x-auto p-3 min-w-0">
            {isUser ? (
              <Text variant="bodyMedium" color="inverse" className="whitespace-pre-wrap">
                {message.content}
              </Text>
            ) : (
              <article className="overflow-x-auto min-w-0 chat-markdown text-foreground">
                {blockMatches.map((blockMatch, index) => {
                  const Component = blockMatch.block.component;
                  return (
                    <Component
                      key={`block-${index}-${blockMatch.output.slice(0, 20).replace(/\s/g, '')}`}
                      blockMatch={blockMatch}
                    />
                  );
                })}
              </article>
            )}
            {!isUser &&
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
                        variant="light"
                        size="sm"
                        className="justify-start p-2 w-full h-auto text-left text-tiny text-primary/80 hover:text-primary hover:bg-primary/10"
                        onPress={() => {
                          onSuggestionClick?.(suggestion);
                        }}
                      >
                        {suggestion}
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </CardBody>
        </Card>
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
