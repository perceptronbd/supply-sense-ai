'use client';

import { Text } from '@/components/ui/Text';
import { useEffect, useRef } from 'react';
import { LoadingMessage, MessageBubble } from './MessageBubble';
import type { MessageListProps } from './types';

export function MessageList({ messages, isLoading = false, onSuggestionClick }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages and isLoading dependencies are needed for auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);
  if (messages.length === 0 && !isLoading) {
    return (
      <section
        className="flex-1 flex items-center justify-center p-8 bg-background"
        aria-label="Chat welcome message"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Text variant="bodyLarge" as="span" role="img" aria-label="Chat bubble">
              💬
            </Text>
          </div>
          <Text variant="titleMedium" color="default" weight="semiBold" className="mb-2" as="h2">
            Start a conversation
          </Text>
          <Text variant="bodyMedium" color="muted" className="max-w-md" as="p">
            Ask me anything about your SupplySense data - from inventory levels to supplier
            performance, purchase orders, and cost analysis.
          </Text>
          <div className="mt-6 space-y-2">
            <Text variant="bodySmall" color="muted" as="p">
              Try asking:
            </Text>
            <ul className="space-y-1 text-small text-default-600">
              <li>
                <Text variant="bodySmall" color="muted" as="span">
                  • "Show me suppliers with low performance"
                </Text>
              </li>
              <li>
                <Text variant="bodySmall" color="muted" as="span">
                  • "What items are running low on stock?"
                </Text>
              </li>
              <li>
                <Text variant="bodySmall" color="muted" as="span">
                  • "Analyze our purchase costs this month"
                </Text>
              </li>
            </ul>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section
      className="flex-1 overflow-y-auto p-4 bg-background"
      role="log"
      aria-label="Chat messages"
    >
      <div className="max-w-4xl mx-auto">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} onSuggestionClick={onSuggestionClick} />
        ))}
        {isLoading && <LoadingMessage />}
        <div ref={messagesEndRef} />
      </div>
    </section>
  );
}
