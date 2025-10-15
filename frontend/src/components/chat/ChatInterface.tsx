'use client';

import { useCallback, useMemo } from 'react';
import { Text } from '@/components/ui/Text';
import { useMessageManager } from '@/hooks/useMessageManager';
import { useSessionTitleUpdate } from '@/hooks/useSessionTitleUpdate';
import type { ChatMessageResponse } from '@/store/api/chatApi';
import { useSendQueryMutation } from '@/store/api/chatApi';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import { SampleQuestions } from './SampleQuestions';
import type { ChatInterfaceProps } from './types';

export function ChatInterface({
  sessionId,
  dbConnectionId,
  className,
  handleCreateSession,
}: Readonly<ChatInterfaceProps>) {
  const {
    messages,
    isLoadingMessages,
    messagesError,
    addErrorMessage,
    refetchMessages,
    addTempMessage,
    removeTempMessage,
  } = useMessageManager(sessionId);

  const [sendQuery, { isLoading: isSendingMessage }] = useSendQueryMutation();

  // Handle session title updates when first AI response is received
  useSessionTitleUpdate(sessionId, messages);

  // Handle sending messages with improved error handling and session management
  const handleSendMessage = useCallback(
    async (content: string) => {
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
        addErrorMessage(
          currentSessionId,
          'No database connection available. Please check your setup.'
        );
        return;
      }
      const tempId = addTempMessage({
        sessionId: currentSessionId,
        content: content,
        type: 'user',
        contentType: 'text',
        userId: 'current-user-id',
      });
      try {
        // Send message via API
        await sendQuery({
          sessionId: currentSessionId,
          query: content,
          dbConnectionId: dbConnectionId,
        }).unwrap();

        // Refetch messages to get the complete conversation from database
        refetchMessages();
        removeTempMessage(tempId);
      } catch (error) {
        console.error('Failed to send message:', error);
        addErrorMessage(currentSessionId, 'Failed to send message. Please try again.');
        removeTempMessage(tempId);
      }
    },
    [
      sessionId,
      dbConnectionId,
      handleCreateSession,
      addErrorMessage,
      refetchMessages,
      sendQuery,
      addTempMessage,
      removeTempMessage,
    ]
  );

  // Handle suggestion clicks by sending them as messages
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSendMessage(suggestion);
    },
    [handleSendMessage]
  );

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

      <SampleQuestions />
    </section>
  );
}
