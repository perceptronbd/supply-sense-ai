'use client';
import { Text } from '@/components/ui/Text';
import type { RootState } from '@/store/store';
import { Card, CardBody } from '@heroui/react';
import { BarChart3, Building2, DollarSign, FileText, Inbox, Package } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { LoadingMessage, MessageBubble } from './MessageBubble';
import type { MessageListProps } from './types';

const defaultSuggestions = [
  {
    title: 'Show suppliers with low performance',
    icon: BarChart3,
  },
  {
    title: 'What items are running low on stock?',
    icon: Package,
  },
  {
    title: 'Analyze our purchase costs this month',
    icon: DollarSign,
  },
  {
    title: 'List pending purchase requests',
    icon: FileText,
  },
  {
    title: 'Show goods receipts from this week',
    icon: Inbox,
  },
  {
    title: 'Which branches have the highest inventory?',
    icon: Building2,
  },
];

export function MessageList({ messages, isLoading = false, onSuggestionClick }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useSelector((state: RootState) => state.auth);

  // Auto-scroll to bottom when new messages arrive
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages and isLoading dependencies are needed for auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <section
        className="flex flex-1 justify-center items-center"
        aria-label="Chat welcome message"
      >
        <div className="px-8 w-full text-center">
          {/* Personalized Greeting */}
          <header className="mb-12">
            <Text variant="display" color="default" weight="bold" className="mb-4" as="h1">
              Hi,{' '}
              <Text variant="display" color="secondary" weight="bold" className="mb-4" as="span">
                {' '}
                {user?.firstName && user.lastName
                  ? `${user?.firstName}  ${user?.lastName}`
                  : 'there'}
              </Text>
            </Text>
            <Text variant="headerMedium" color="default" weight="bold" className="mb-6" as="h2">
              What can I help you with?
            </Text>
            <Text variant="bodyLarge" color="muted" as="p">
              Choose a prompt below or write your own to start chatting with SupplySense AI.
            </Text>
          </header>

          {/* Suggestion Cards */}
          <div className="grid grid-cols-1 gap-4 mt-8 md:grid-cols-2 max-w-4xl mx-auto mb-5">
            {defaultSuggestions.map((suggestion) => {
              const IconComponent = suggestion.icon;
              return (
                <Card
                  key={suggestion.title}
                  isPressable
                  onPress={() => onSuggestionClick?.(suggestion.title)}
                  className="border transition-all duration-200 cursor-pointer bg-default-300 hover:bg-content2 border-divider hover:shadow-medium"
                >
                  <CardBody className="p-4">
                    <div className="flex gap-3 items-start ">
                      <IconComponent className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                      <Text
                        variant="bodyXSmall"
                        color="default"
                        weight="medium"
                        className="text-left"
                        as="span"
                      >
                        {suggestion.title}
                      </Text>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-y-auto flex-1 p-4" role="log" aria-label="Chat messages">
      <div className="mx-auto max-w-4xl">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} onSuggestionClick={onSuggestionClick} />
        ))}
        {isLoading && <LoadingMessage />}
        <div ref={messagesEndRef} />
      </div>
    </section>
  );
}
