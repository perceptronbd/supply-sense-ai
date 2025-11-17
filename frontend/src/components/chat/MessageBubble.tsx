'use client';

import { Button } from '@heroui/react';
import { codeBlockLookBack, findCompleteCodeBlock, findPartialCodeBlock } from '@llm-ui/code';
import { markdownLookBack } from '@llm-ui/markdown';
import { useLLMOutput } from '@llm-ui/react';
import { format, isToday, isValid, isYesterday } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { MascotAwake, MascotError2 } from '@/components/icons/Mascot';
import { Text } from '@/components/ui/Text';
import { Icons } from '@/lib/icons/Icons';
import { cn } from '@/lib/utils';
import type { ChatMessageResponse } from '@/store/api/chatApi';
import BlinkingLogo from '../ui/animations/BlinkingLogo';
import { AssistantMessage } from './AssistantMessage';
import LLMCodeBlockComponent from './LLMCodeBlockComponent';
import LLMMarkdownComponent from './LLMMarkdownComponent';
import { UserMessage } from './UserMessage';
import './markdown.css';

interface MessageBubbleProps {
  message: ChatMessageResponse;
  onSuggestionClick?: (suggestion: string) => void;
  isError?: boolean;
}

export function MessageBubble({ message, onSuggestionClick: _, isError }: MessageBubbleProps) {
  const isUser = message.type === 'user';
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  console.log('Error', isError);

  // Use llm-ui for AI message rendering
  const { blockMatches } = useLLMOutput({
    llmOutput: message.content,
    fallbackBlock: {
      component: LLMMarkdownComponent,
      lookBack: markdownLookBack(),
    },
    blocks: [
      {
        component: LLMCodeBlockComponent,
        findCompleteMatch: findCompleteCodeBlock(),
        findPartialMatch: findPartialCodeBlock(),
        lookBack: codeBlockLookBack(),
      },
    ],
    isStreamFinished: true, // Message is complete
  });

  // Format timestamp for assistant messages (e.g., "Sun at 12:30 AM")
  const getFormattedTime = (dateString?: string) => {
    if (!dateString) return 'now';
    const date = new Date(dateString);
    if (!isValid(date)) return 'now';
    try {
      if (isToday(date)) return format(date, "'Today at' h:mm a");
      if (isYesterday(date)) return format(date, "'Yesterday at' h:mm a");
      return format(date, "EEE 'at' h:mm a");
    } catch {
      return 'now';
    }
  };

  const timestamp = getFormattedTime(message.createdAt);

  // Copy message to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);

      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  // Cleanup timeout on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <article
      className={cn(
        'flex gap-3 w-full overflow-x-clip mb-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
      aria-label={`${isUser ? 'User' : 'AI Assistant'} message at ${timestamp}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0">
          {isError ? (
            <MascotError2 size={36} className="text-primary" />
          ) : (
            <MascotAwake size={36} className="text-primary" />
          )}
        </div>
      )}

      {/* Message content */}
      <div className={cn(isUser ? 'items-end' : 'items-start', 'flex flex-col flex-1')}>
        {isUser ? (
          <UserMessage content={message.content} copied={copied} onCopy={copyToClipboard} />
        ) : (
          <AssistantMessage blockMatches={blockMatches} message={message} />
        )}

        {/* Action buttons and timestamp for assistant messages */}
        {!isUser && (
          <div className="flex items-center justify-between w-full mt-2 gap-2">
            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                aria-label={copied ? 'Copied' : 'Copy message'}
                onPress={copyToClipboard}
              >
                {copied ? <Icons.Check /> : <Icons.Copy />}
              </Button>
              <Button isIconOnly variant="light" size="sm" aria-label="Like message">
                <Icons.ThumbsUp />
              </Button>
              <Button isIconOnly variant="light" size="sm" aria-label="Dislike message">
                <Icons.ThumbsDown />
              </Button>
              <Button isIconOnly variant="light" size="sm" aria-label="Regenerate message">
                <Icons.RefreshCw />
              </Button>
            </div>

            {/* Timestamp */}
            <Text
              variant="bodyXSmall"
              className="text-default-500 text-right flex-shrink-0"
              as="time"
            >
              {timestamp}
            </Text>
          </div>
        )}
      </div>
    </article>
  );
}

// Loading message component
export function LoadingMessage() {
  return (
    <article className="flex gap-3 mb-4" aria-label="AI is processing your request">
      <BlinkingLogo floating={false} size={36} />
      <Text variant="bodyMedium" color="muted" as="span">
        AI is thinking...
      </Text>
    </article>
  );
}
