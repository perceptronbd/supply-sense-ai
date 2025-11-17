'use client';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Text } from '@/components/ui/Text';
import { useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store/store';
import { LoadingMessage, MessageBubble } from './MessageBubble';
import type { MessageListProps } from './types';

export function MessageList({
  messages,
  isError,
  isLoading = false,
  onSuggestionClick,
}: Readonly<MessageListProps>) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useSelector((state: RootState) => state.auth);
  const { sessionId } = useAppSelector((state) => state.chat);

  // biome-ignore lint/correctness/useExhaustiveDependencies: messages and isLoading dependencies are needed for auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!sessionId) {
    return (
      <section
        className="items-center justify-center mt-8 md:flex md:mt-12"
        aria-label="Chat welcome message"
      >
        <div className="w-full px-8 text-center">
          {/* Personalized Greeting */}
          <header className="mb-12">
            <Text variant="display" color="default" weight="bold" className="mb-4" as="h1">
              Hi,{' '}
              <Text
                variant="display"
                color="secondary"
                weight="bold"
                className="mb-4 -tracking-tighter"
                as="span"
              >
                {' '}
                {user?.firstName && user.lastName
                  ? `${user?.firstName}  ${user?.lastName}`
                  : 'there'}
              </Text>
            </Text>
            <Text
              variant="headerMedium"
              color="default"
              weight="bold"
              className="mb-6 -tracking-tighter"
              as="h2"
            >
              What can I help you with?
            </Text>
          </header>
        </div>
      </section>
    );
  }

  return (
    <section
      className="w-full h-full p-5 mb-40 overflow-y-auto no-scrollbar"
      role="log"
      aria-label="Chat messages"
    >
      <div className="max-w-4xl mx-auto">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onSuggestionClick={onSuggestionClick}
            isError={isError}
          />
        ))}
        {isLoading && <LoadingMessage />}
        <div ref={messagesEndRef} />
      </div>
    </section>
  );
}
