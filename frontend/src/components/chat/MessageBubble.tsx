'use client';

import { AiIcon, UserIcon } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import type { ChatMessage } from '@/store/api/chatApi';
import { Avatar, Button, Card, CardBody, Spinner } from '@heroui/react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import './markdown.css';

interface MessageBubbleProps {
  message: ChatMessage;
  onSuggestionClick?: (suggestion: string) => void;
}

export function MessageBubble({ message, onSuggestionClick }: MessageBubbleProps) {
  const isUser = message.type === 'user';
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
          icon={isUser ? <UserIcon className="w-5 h-5" /> : <AiIcon className="w-5 h-5" />}
          classNames={{
            base: 'w-8 h-8 min-w-8',
            icon: isUser ? 'text-primary-foreground' : 'text-secondary-foreground',
          }}
          color={isUser ? 'primary' : 'secondary'}
          size="sm"
        />
      </div>{' '}
      {/* Message content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <Card
          className={`${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-content2 text-foreground border border-divider'
          }`}
        >
          <CardBody className="p-3">
            {isUser ? (
              <Text variant="bodyMedium" color="inverse" className="whitespace-pre-wrap">
                {message.content}
              </Text>
            ) : (
              <article className="chat-markdown text-foreground">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </article>
            )}
            {!isUser &&
            message.metadata &&
            message.metadata.suggestions &&
            Array.isArray(message.metadata.suggestions) ? (
              <section
                className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-medium"
                aria-label="Suggested follow-up questions"
              >
                <Text variant="bodySmall" color="primary" weight="medium" className="mb-2" as="h4">
                  💡 Suggested follow-up questions:
                </Text>
                <ul className="space-y-1">
                  {message.metadata.suggestions.map((suggestion: string, index: number) => (
                    <li key={`suggestion-${index}-${suggestion.slice(0, 20)}`}>
                      <Button
                        variant="light"
                        size="sm"
                        className="h-auto p-2 justify-start text-left text-tiny text-primary/80 hover:text-primary hover:bg-primary/10 w-full"
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
          color="muted"
          className={`mt-1 ${isUser ? 'text-right' : 'text-left'}`}
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
      <div className="flex-shrink-0">
        <Avatar
          icon={<AiIcon className="w-5 h-5" />}
          classNames={{
            base: 'w-8 h-8 min-w-8',
            icon: 'text-secondary-foreground',
          }}
          color="secondary"
          size="sm"
        />
      </div>

      <div className="flex-1 max-w-[80%]">
        <Card className="bg-content2 border border-divider">
          <CardBody className="p-3">
            <div className="flex items-center gap-2">
              <Spinner size="sm" color="primary" />
              <Text variant="bodyMedium" color="muted" as="span">
                AI is thinking...
              </Text>
            </div>
          </CardBody>
        </Card>
      </div>
    </article>
  );
}
