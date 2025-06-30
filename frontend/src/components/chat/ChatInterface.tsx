'use client';

import { Text } from '@/components/ui/Text';
import { useGetSessionMessagesQuery, useSendQueryMutation } from '@/store/api/chatApi';
import type { ChatMessage } from '@/store/api/chatApi';
import { useEffect, useState } from 'react';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import type { ChatInterfaceProps } from './types';

export function ChatInterface({ sessionId, className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSessionId, _setCurrentSessionId] = useState<string | null>(sessionId || null);
  // RTK Query hooks
  const {
    data: fetchedMessages,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useGetSessionMessagesQuery(
    { sessionId: currentSessionId as string },
    { skip: !currentSessionId }
  );

  const [sendQuery, { isLoading: isSendingMessage }] = useSendQueryMutation();

  // Update messages when fetched from API
  useEffect(() => {
    if (fetchedMessages) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages]); // Handle session creation and message sending
  const handleSendMessage = async (content: string) => {
    if (!currentSessionId) {
      console.error('No session ID available');
      return;
    }

    // Create a temporary message for immediate UI feedback
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: currentSessionId,
      content,
      type: 'user',
      contentType: 'text',
      userId: '', // Will be set by the server
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      // Send message via API
      const response = await sendQuery({
        sessionId: currentSessionId,
        query: content,
      }).unwrap();

      // Remove temporary message and add the AI response
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== tempMessage.id); // Create AI response message
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          sessionId: response.sessionId,
          content: response.message,
          type: 'assistant',
          contentType: response.type === 'data' ? 'data' : 'text',
          metadata: response.metadata,
          userId: '', // AI messages don't have user IDs
          createdAt: response.timestamp || new Date().toISOString(),
          updatedAt: response.timestamp || new Date().toISOString(),
        };

        return [...filtered, tempMessage, aiMessage];
      });
    } catch (error) {
      console.error('Failed to send message:', error);

      // Remove the temporary message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));

      // TODO: Add proper error handling/notification
      console.error('Failed to send message. Please try again.');
    }
  };

  // Handle suggestion clicks
  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };
  // Show error state if messages failed to load
  if (messagesError) {
    return (
      <section
        className={`flex justify-center items-center h-full bg-background ${className}`}
        aria-label="Chat error"
      >
        <div className="text-center">
          <Text variant="titleSmall" color="danger" className="mb-2" as="h2">
            Failed to load chat
          </Text>
          <Text variant="bodyMedium" color="muted" as="p">
            Please refresh the page or try again later.
          </Text>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`flex flex-col h-full bg-background ${className}`}
      aria-label="Chat interface"
    >
      <MessageList
        messages={messages}
        isLoading={isLoadingMessages || isSendingMessage}
        onSuggestionClick={handleSuggestionClick}
      />
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isSendingMessage}
        disabled={isLoadingMessages}
      />
    </section>
  );
}
