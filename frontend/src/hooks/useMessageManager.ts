import { useGetSessionMessagesQuery } from '@/store/api/chatApi';
import type { ChatMessage } from '@/store/api/chatApi';
import { useCallback, useEffect, useState } from 'react';

export interface UseMessageManagerReturn {
    messages: ChatMessage[];
    isLoadingMessages: boolean;
    messagesError: unknown;
    addErrorMessage: (sessionId: string, errorText: string) => void;
    refetchMessages: () => void;
}

/**
 * Custom hook for managing chat messages state and operations
 * Handles message fetching, temporary messages, and error messages
 */
export function useMessageManager(sessionId: string | undefined): UseMessageManagerReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const {
        data: fetchedMessages,
        isLoading: isLoadingMessages,
        error: messagesError,
        refetch,
    } = useGetSessionMessagesQuery({ sessionId: sessionId as string }, { skip: !sessionId });

    // Update local messages when fetched from API
    useEffect(() => {
        if (fetchedMessages) {
            // Use fetched messages as the single source of truth
            setMessages(fetchedMessages);
        } else if (!sessionId) {
            // Clear messages when no session is selected
            setMessages([]);
        }
    }, [fetchedMessages, sessionId]);





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

        setMessages((prev) => [...prev, errorMessage]);
    }, []);

    const refetchMessages = useCallback(() => {
        if (sessionId) {
            refetch();
        }
    }, [sessionId, refetch]);

    return {
        messages,
        isLoadingMessages,
        messagesError,
        addErrorMessage,
        refetchMessages,
    };
}