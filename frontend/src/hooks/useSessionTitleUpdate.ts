import type { ChatMessage } from '@/store/api/chatApi';
import { markSessionProcessed, triggerSessionRefresh } from '@/store/slices/chatSlice';
import type { RootState } from '@/store/store';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

/**
 * Custom hook to handle session title updates when first AI response is received
 * Simplifies the complex callback pattern by using Redux for state management
 */
export function useSessionTitleUpdate(sessionId: string | undefined, messages: ChatMessage[]) {
  const dispatch = useDispatch();
  const processedSessions = useSelector((state: RootState) => state.chat.processedSessions);

  useEffect(() => {
    // Early returns for invalid states
    if (!sessionId || !messages.length) return;
    if (processedSessions.includes(sessionId)) return;

    // Look for the first assistant message
    const firstAssistantMessage = messages.find((msg) => msg.type === 'assistant');

    if (firstAssistantMessage) {
      console.log('First assistant message detected for session:', sessionId);

      // Mark this session as processed
      dispatch(markSessionProcessed(sessionId));

      // Trigger session refresh to update titles
      dispatch(triggerSessionRefresh());
    }
  }, [messages, sessionId, processedSessions, dispatch]);
}
