'use client';

import { useCallback, useMemo, useState } from 'react';
import { Text } from '@/components/ui/Text';
import { useChatStream } from '@/hooks/useChatStream';
import { useMessageManager } from '@/hooks/useMessageManager';
import { useSessionTitleUpdate } from '@/hooks/useSessionTitleUpdate';
import type { ChatMessageResponse } from '@/store/api/chatApi';
import { useSendQueryMutation } from '@/store/api/chatApi';
import { useAppSelector } from '@/store/hooks';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import { SampleQuestions } from './SampleQuestions';
import type { ChatInterfaceProps } from './types';

export function ChatInterface({
  dbConnectionId,
  className,
  handleCreateSession,
}: Readonly<ChatInterfaceProps>) {
  const { sessionId } = useAppSelector((state) => state.chat);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState<boolean>(false);

  const {
    messages,
    isLoadingMessages,
    messagesError,
    addErrorMessage,
    refetchMessages,
    addTempMessage,
    removeTempMessage,
    updateTempMessage,
  } = useMessageManager(sessionId);

  const [sendQuery, { isLoading: isSendingMessage }] = useSendQueryMutation();
  const { streamChat, isStreaming } = useChatStream();

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
          currentSessionId = (await handleCreateSession()) || '';
          if (!currentSessionId) {
            setIsError(true);
            addErrorMessage('', 'Failed to create session. Please try again.');
            return;
          }
        } catch (error) {
          setIsError(true);
          console.error('Failed to create session:', error);
          addErrorMessage('', 'Failed to create session. Please try again.');
          return;
        }
      }

      if (!dbConnectionId) {
        setIsError(true);
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
        // Create assistant temp message
        const assistantTempId = addTempMessage({
          sessionId: currentSessionId,
          content: '',
          type: 'assistant',
          contentType: 'text',
          userId: 'system',
        });

        let fullContent = '';

        await streamChat({
          sessionId: currentSessionId,
          message: content,
          dbConnectionId,
          onChunk: (chunk) => {
            fullContent += chunk;
            updateTempMessage(assistantTempId, fullContent);
          },
          onComplete: () => {
            removeTempMessage(tempId);
            removeTempMessage(assistantTempId);
            refetchMessages();
            setIsError(false);
          },
          onError: (error) => {
            console.error('Streaming error:', error);
            setIsError(true);
            addErrorMessage(currentSessionId, 'Failed to send message. Please try again.');
            removeTempMessage(tempId);
            removeTempMessage(assistantTempId);
          },
        });
      } catch (error) {
        setIsError(true);
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
      addTempMessage,
      removeTempMessage,
      updateTempMessage,
      streamChat,
    ]
  );

  // Handle suggestion clicks by setting the message in the chat input
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setMessage(suggestion);
  }, []);

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
      className={`flex flex-col items-center md:justify-center overflow-y-auto md:overflow-y-visible w-full h-full relative ${className}`}
      aria-label="Chat interface"
    >
      {/* Message list with loading and suggestion handling */}
      <MessageList
        messages={messages as unknown as ChatMessageResponse[]}
        isLoading={isLoadingMessages || isSendingMessage || isStreaming}
        isError={isError}
        onSuggestionClick={handleSuggestionClick}
      />

      {/* Chat input with send message handling */}
      <ChatInput
        message={message}
        setMessage={setMessage}
        onSendMessage={handleSendMessage}
        isLoading={isSendingMessage || isStreaming}
        disabled={isLoadingMessages}
      />

      {!sessionId && (
        <SampleQuestions
          dbConnectionId={dbConnectionId as string}
          onQuestionClick={handleSuggestionClick}
        />
      )}
    </section>
  );
}
