'use client';

import { Button } from '@heroui/react';
import { format, isToday, isValid, isYesterday } from 'date-fns';
import { memo } from 'react';
import { Icons } from '../icons/Icons';
import { MascotAwake } from './Logo';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIMessageProps {
  msg: ChatMessage;
  onCopy: () => void;
  copied: boolean;
}

// Format timestamp for assistant messages (e.g., "Sun at 12:30 AM")
function formatTimestamp(date: Date) {
  if (!date || !isValid(date)) return 'now';
  try {
    if (isToday(date)) return format(date, "'Today at' h:mm a");
    if (isYesterday(date)) return format(date, "'Yesterday at' h:mm a");
    return format(date, "EEE 'at' h:mm a");
  } catch {
    return 'now';
  }
}

function AIMessageComponent({ msg, onCopy, copied }: Readonly<AIMessageProps>) {
  return (
    <div className="flex gap-3 w-full mb-4">
      <MascotAwake size={36} className="text-primary flex-shrink-0" />

      <div className="flex flex-col flex-1">
        {/* Bubble */}
        <div className="bg-inherit rounded-xl px-1 py-1 max-w-md">
          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
        </div>

        {/* action buttons + timestamp */}
        <div className="flex items-center justify-between w-full mt-2">
          <div className="flex items-center gap-1">
            <Button isIconOnly size="sm" variant="light" onPress={onCopy}>
              {copied ? <Icons.Check /> : <Icons.Copy />}
            </Button>

            <Button isIconOnly size="sm" variant="light">
              <Icons.ThumbsUp />
            </Button>
            <Button isIconOnly size="sm" variant="light">
              <Icons.ThumbsDown />
            </Button>
            <Button isIconOnly size="sm" variant="light">
              <Icons.RefreshCw />
            </Button>
          </div>

          <span className="text-xs text-default-500 flex-shrink-0">
            {formatTimestamp(msg.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}

export const AIMessage = memo(AIMessageComponent);
export default AIMessage;
