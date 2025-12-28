import { useCallback, useState } from 'react';
import { config } from '@/config/env';
import { useAppSelector } from '@/store/hooks';

interface StreamChatParams {
  sessionId: string;
  message: string;
  dbConnectionId: string;
  context?: Record<string, unknown>;
  onChunk: (chunk: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export function useChatStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const token = useAppSelector((state) => state.auth.token);

  const streamChat = useCallback(
    async ({
      sessionId,
      message,
      dbConnectionId,
      context,
      onChunk,
      onComplete,
      onError,
    }: StreamChatParams) => {
      setIsStreaming(true);

      try {
        const response = await fetch(config.getApiUrl('/api/chat/stream'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sessionId,
            query: message,
            dbConnectionId,
            context,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          onChunk(chunk);
        }

        onComplete?.();
      } catch (error) {
        console.error('Streaming error:', error);
        onError?.(error instanceof Error ? error : new Error('Unknown error'));
      } finally {
        setIsStreaming(false);
      }
    },
    [token]
  );

  return {
    streamChat,
    isStreaming,
  };
}
