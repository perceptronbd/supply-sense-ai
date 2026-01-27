import { QueryActionCreatorResult } from '@reduxjs/toolkit/query/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChatMessage } from '@/store/api/chatApi';
import { useGetSessionMessagesQuery } from '@/store/api/chatApi';

export interface UseMessageManagerReturn {
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  messagesError: unknown;
  addErrorMessage: (sessionId: string, errorText: string) => void;
  refetchMessages: () => QueryActionCreatorResult<any> | undefined;
  addTempMessage: (message: Omit<ChatMessage, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateTempMessage: (tempId: string, content: string) => void;
  removeTempMessage: (tempId: string) => void;
}

/**
 * Custom hook for managing chat messages state and operations
 * Handles message fetching, temporary messages, and error messages
 */
export function useMessageManager(sessionId: string | undefined): UseMessageManagerReturn {
  const [tempMessages, setTempMessages] = useState<Record<string, ChatMessage>>({});
  const {
    data: fetchedMessages,
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch,
  } = useGetSessionMessagesQuery({ sessionId: sessionId as string }, { skip: !sessionId });

  // Compute merged messages using useMemo instead of useEffect + useState
  const messages = useMemo(() => {
    if (!sessionId) {
      return [];
    }

    // If not fetched yet, start with empty array but allow temp messages to be added
    // IMPORTANT: Filter fetched messages to only include messages from the current session
    // This prevents showing cached messages from previous sessions
    const updatedMessages = fetchedMessages
      ? fetchedMessages.filter((msg) => msg.sessionId === sessionId)
      : [];

    // Add temp messages that don't have a corresponding real message yet
    // Also filter temp messages to only include messages from the current session
    for (const tempMsg of Object.values(tempMessages)) {
      if (
        tempMsg.sessionId === sessionId &&
        !updatedMessages.some((msg) => msg.id === tempMsg.id)
      ) {
        updatedMessages.push(tempMsg);
      }
    }

    // Sort by creation time
    updatedMessages.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return updatedMessages;
  }, [fetchedMessages, tempMessages, sessionId]);
  // Clear temp messages when session changes
  useEffect(() => {
    setTempMessages({});
  }, [sessionId]);

  // Add a temporary message
  const addTempMessage = useCallback(
    (message: Omit<ChatMessage, 'id' | 'createdAt' | 'updatedAt'>) => {
      const tempMessage: ChatMessage = {
        ...message,
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTempMessages((prev) => ({
        ...prev,
        [tempMessage.id]: tempMessage,
      }));

      return tempMessage.id;
    },
    []
  );

  // Remove a temporary message
  const removeTempMessage = useCallback((tempId: string) => {
    setTempMessages((prev) => {
      const newTempMessages = { ...prev };
      delete newTempMessages[tempId];
      return newTempMessages;
    });
  }, []);

  // Update a temporary message
  const updateTempMessage = useCallback((tempId: string, content: string) => {
    setTempMessages((prev) => {
      const message = prev[tempId];
      if (!message) return prev;

      return {
        ...prev,
        [tempId]: {
          ...message,
          content,
        },
      };
    });
  }, []);

  const addErrorMessage = useCallback((sessionId: string, errorText: string) => {
    const errorMessage: ChatMessage = {
      id: `error-${Date.now()}`,
      sessionId,
      content: errorText,
      type: 'error',
      contentType: 'text',
      userId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTempMessages((prev) => ({
      ...prev,
      [errorMessage.id]: errorMessage,
    }));
  }, []);

  const refetchMessages = useCallback(() => {
    if (sessionId) {
      return refetch();
    }
  }, [sessionId, refetch]);

  return {
    messages,
    isLoadingMessages,
    messagesError,
    addErrorMessage,
    refetchMessages,
    addTempMessage,
    updateTempMessage,
    removeTempMessage,
  };
}
