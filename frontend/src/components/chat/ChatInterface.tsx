'use client';

import { Text } from '@/components/ui/Text';
import { useSendQueryMutation } from '@/store/api/chatApi';
import type { ChatMessageResponse } from '@/store/api/chatApi';
import { useMessageManager } from '@/hooks/useMessageManager';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import type { ChatInterfaceProps } from './types';

export function ChatInterface({
  sessionId,
  dbConnectionId,
  className,
  handleCreateSession,
  onSessionUpdate,
}: Readonly<ChatInterfaceProps>) {
  const {
    messages,
    isLoadingMessages,
    messagesError,
    addErrorMessage,
    refetchMessages,
  } = useMessageManager(sessionId);

  const [sendQuery, { isLoading: isSendingMessage }] = useSendQueryMutation();

  // Track if we've seen the first assistant message for this session
  const hasSeenFirstAssistantMessage = useRef<Set<string>>(new Set());

  // Monitor messages to detect first assistant message and trigger session update
  useEffect(() => {
    if (!sessionId || !onSessionUpdate || !messages.length) return;

    // Check if this session already had its first assistant message processed
    if (hasSeenFirstAssistantMessage.current.has(sessionId)) return;

    // Look for the first assistant message
    const firstAssistantMessage = messages.find(msg => msg.type === 'assistant');

    if (firstAssistantMessage) {
      console.log('First assistant message detected for session:', sessionId);

      // Mark this session as having seen its first assistant message
      hasSeenFirstAssistantMessage.current.add(sessionId);

      // Trigger session update to refresh the title
      onSessionUpdate();
    }
  }, [messages, sessionId, onSessionUpdate]);

  // Handle sending messages with improved error handling and session management
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    let currentSessionId = sessionId;

    // Ensure we have a session before sending message
    if (!currentSessionId) {
      try {
        currentSessionId = await handleCreateSession();
        if (!currentSessionId) {
          addErrorMessage('', 'Failed to create session. Please try again.');
          return;
        }
      } catch (error) {
        console.error('Failed to create session:', error);
        addErrorMessage('', 'Failed to create session. Please try again.');
        return;
      }
    }

    if (!dbConnectionId) {
      addErrorMessage(currentSessionId, 'No database connection available. Please check your setup.');
      return;
    }

    try {
      // Send message via API
      await sendQuery({
        sessionId: currentSessionId,
        query: content,
        dbConnectionId: dbConnectionId,
      }).unwrap();

      // Refetch messages to get the complete conversation from database
      refetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      addErrorMessage(currentSessionId, 'Failed to send message. Please try again.');
    }
  }, [
    sessionId,
    dbConnectionId,
    handleCreateSession,
    addErrorMessage,
    refetchMessages,
    sendQuery,
  ]);

  // Handle suggestion clicks by sending them as messages
  const handleSuggestionClick = useCallback((suggestion: string) => {
    handleSendMessage(suggestion);
  }, [handleSendMessage]);

  // Memoized error state for better performance
  const errorState = useMemo(() => {
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
    return null;
  }, [messagesError, className]);

  if (errorState) {
    return errorState;
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
