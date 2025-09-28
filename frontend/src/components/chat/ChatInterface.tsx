'use client';

import { Text } from '@/components/ui/Text';
import { useGetSessionMessagesQuery, useSendQueryMutation } from '@/store/api/chatApi';
import type { ChatMessage, ChatMessageResponse } from '@/store/api/chatApi';
import { useEffect, useState } from 'react';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import type { ChatInterfaceProps } from './types';

export function ChatInterface({
  sessionId,
  dbConnectionId,
  className,
  handleCreateSession,
}: Readonly<ChatInterfaceProps>) {
  // Local state for managing messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isFirstMessage, setIsFirstMessage] = useState(false);

  // RTK Query hooks for data fetching and mutations
  const {
    data: fetchedMessages,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useGetSessionMessagesQuery({ sessionId: sessionId as string }, { skip: !sessionId });

  const [sendQuery, { isLoading: isSendingMessage }] = useSendQueryMutation();

  // Update local messages when fetched from API
  useEffect(() => {
    if (fetchedMessages) {
      // If we're sending the first message, preserve temporary messages
      if (isFirstMessage) {
        setMessages((prevMessages) => {
          const tempMessages = prevMessages.filter((msg) => msg.id.startsWith('temp-'));
          return [...fetchedMessages, ...tempMessages];
        });
      } else {
        setMessages(fetchedMessages);
      }
    } else if (!sessionId) {
      // Clear messages when no session is selected
      setMessages([]);
    }
  }, [fetchedMessages, isFirstMessage, sessionId]);

  // Handle sending messages with database connection support
  const handleSendMessage = async (content: string) => {
    let currentSessionId = sessionId;
    let isNewSession = false;

    // Ensure we have a session before sending message
    if (!currentSessionId) {
      try {
        // Create session and wait for it to be available
        currentSessionId = await handleCreateSession();
        if (!currentSessionId) {
          console.error('Failed to create session');
          return;
        }
        isNewSession = true;
        setIsFirstMessage(true);
      } catch (error) {
        console.error('Failed to create session:', error);
        return;
      }
    }

    if (!dbConnectionId) {
      console.error('No database connection ID available');
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

    // Add temporary message to local state for immediate feedback
    setMessages((prev) => [...prev, tempMessage]);

    try {
      // Send message via API with database connection ID
      const response = await sendQuery({
        sessionId: currentSessionId,
        query: content,
        dbConnectionId: dbConnectionId,
        // dbConnectionId: "4211de11-d909-44ee-ab1e-420e095f9cae"
      }).unwrap();

      // Remove temporary message and add both user message and AI response
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== tempMessage.id);

        // Create final user message
        const userMessage: ChatMessage = {
          ...tempMessage,
          id: `user-${Date.now()}`,
        };

        // Create AI response message
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

        return [...filtered, userMessage, aiMessage];
      });

      // Clear first message flag after successful send
      if (isNewSession) {
        setIsFirstMessage(false);
      }
    } catch (error) {
      console.error('Failed to send message:', error);

      // Remove the temporary message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));

      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        sessionId: currentSessionId,
        content: 'Failed to send message. Please try again.',
        type: 'error',
        contentType: 'text',
        userId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);

      // Clear first message flag on error too
      if (isNewSession) {
        setIsFirstMessage(false);
      }
    }
  };

  // Handle suggestion clicks by sending them as messages
  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  // Show error state if messages failed to load
  if (messagesError) {
    return (
      <section
        className={`flex justify-center items-center h-full max-h-[calc(100vh-40px)] flex-1 ${className}`}
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
      className={`flex flex-col size-full max-h-[calc(100vh-40px)] overflow-y-auto  relative ${className}`}
      aria-label="Chat interface"
    >
      {/* Message list with loading and suggestion handling */}
      <MessageList
        messages={messages as unknown as ChatMessageResponse[]}
        isLoading={isLoadingMessages || isSendingMessage}
        onSuggestionClick={handleSuggestionClick}
      />

      {/* Chat input with send message handling */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isSendingMessage}
        disabled={isLoadingMessages}
      />
    </section>
  );
}
