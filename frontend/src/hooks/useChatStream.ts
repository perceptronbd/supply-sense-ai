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

/**
 * Attempts to find and extract a complete JSON object from the start of a string
 * @returns The end index of the JSON object if found, -1 otherwise
 */
function findCompleteJsonEnd(str: string): number {
  if (!str.trimStart().startsWith('{')) {
    return -1;
  }

  let braceCount = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"' && !escaped) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          return i + 1;
        }
      }
    }
  }

  return -1; // Incomplete JSON
}

/**
 * Processes a buffer to extract complete chunks (JSON or text)
 * @returns Object containing the extracted chunk and the number of characters processed
 */
function extractNextChunk(buffer: string): { chunk: string | null; processedLength: number } {
  const remaining = buffer.slice(0);

  // Try to find a complete JSON object at the start
  if (remaining.trimStart().startsWith('{')) {
    const jsonEnd = findCompleteJsonEnd(remaining);

    if (jsonEnd > 0) {
      // Found a complete JSON object
      return {
        chunk: remaining.slice(0, jsonEnd),
        processedLength: jsonEnd,
      };
    } else {
      // Incomplete JSON, wait for more data
      return { chunk: null, processedLength: 0 };
    }
  }

  // Not JSON, extract text until next JSON or end
  const nextJsonStart = remaining.indexOf('{');

  if (nextJsonStart > 0) {
    // Pass text before the next JSON
    return {
      chunk: remaining.slice(0, nextJsonStart),
      processedLength: nextJsonStart,
    };
  } else if (nextJsonStart === -1) {
    // No more JSON in buffer, pass all remaining text
    return {
      chunk: remaining,
      processedLength: buffer.length,
    };
  }

  // Next char is '{', but we're not in JSON mode yet (shouldn't happen)
  return { chunk: null, processedLength: 0 };
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
        let buffer = ''; // Buffer to accumulate incomplete chunks

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process all complete chunks in the buffer
          while (buffer.length > 0) {
            const { chunk: extractedChunk, processedLength } = extractNextChunk(buffer);

            if (extractedChunk) {
              onChunk(extractedChunk);
              buffer = buffer.slice(processedLength);
            } else {
              // No complete chunk available, wait for more data
              break;
            }
          }
        }

        // Process any remaining buffer content
        if (buffer.length > 0) {
          onChunk(buffer);
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
