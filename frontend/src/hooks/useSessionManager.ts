import { useCallback } from 'react';
import { useCreateSessionMutation } from '@/store/api/chatApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearSessions, setSessionId } from '@/store/slices/chatSlice';

export interface UseSessionManagerReturn {
  activeSessionId: string;
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
  const { sessionId } = useAppSelector((state) => state.chat);
  const [createSession, { isLoading: isCreatingSession, error: sessionCreationError }] =
    useCreateSessionMutation();

  const dispatch = useAppDispatch();

  const createNewSession = useCallback(async (): Promise<string | undefined> => {
    if (!selectedDbConnectionId || isCreatingSession) {
      return sessionId;
    }

    try {
      const sessionTitle = `Chat ${new Date().toLocaleString()}`;
      const newSession = await createSession({
        title: sessionTitle,
        description: 'New chat session for supply chain analytics',
        dbConnectionId: selectedDbConnectionId,
      }).unwrap();

      dispatch(setSessionId(newSession.id));
      return newSession.id;
    } catch (error) {
      console.error('Failed to create chat session:', error);
      dispatch(clearSessions());
      throw error;
    }
  }, [selectedDbConnectionId, createSession, isCreatingSession, sessionId, dispatch]);

  const selectSession = useCallback(
    (sessionId: string) => {
      dispatch(setSessionId(sessionId));
    },
    [dispatch]
  );

  const clearSession = useCallback(() => {
    dispatch(clearSessions());
  }, [dispatch]);

  return {
    activeSessionId: sessionId,
    isCreatingSession,
    sessionCreationError,
    createNewSession,
    selectSession,
    clearSession,
  };
}
