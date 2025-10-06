import { useCallback, useState } from 'react';
import { useCreateSessionMutation } from '@/store/api/chatApi';

export interface UseSessionManagerReturn {
  activeSessionId: string | undefined;
  isCreatingSession: boolean;
  sessionCreationError: unknown;
  createNewSession: () => Promise<string | undefined>;
  selectSession: (sessionId: string) => void;
  clearSession: () => void;
}

/**
 * Custom hook for managing chat session state and operations
 * Provides session creation, selection, and error handling
 */
export function useSessionManager(
  selectedDbConnectionId: string | undefined
): UseSessionManagerReturn {
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>();
  const [createSession, { isLoading: isCreatingSession, error: sessionCreationError }] =
    useCreateSessionMutation();

  const createNewSession = useCallback(async (): Promise<string | undefined> => {
    if (!selectedDbConnectionId || isCreatingSession) {
      return activeSessionId;
    }

    try {
      const sessionTitle = `Chat ${new Date().toLocaleString()}`;
      const newSession = await createSession({
        title: sessionTitle,
        description: 'New chat session for supply chain analytics',
        dbConnectionId: selectedDbConnectionId,
      }).unwrap();

      setActiveSessionId(newSession.id);
      return newSession.id;
    } catch (error) {
      console.error('Failed to create chat session:', error);
      setActiveSessionId(undefined);
      throw error;
    }
  }, [selectedDbConnectionId, createSession, isCreatingSession, activeSessionId]);

  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const clearSession = useCallback(() => {
    setActiveSessionId(undefined);
  }, []);

  return {
    activeSessionId,
    isCreatingSession,
    sessionCreationError,
    createNewSession,
    selectSession,
    clearSession,
  };
}
