'use client';

import { SendIcon } from '@/components/icons';
import { Button, Textarea } from '@heroui/react';
import { useEffect, useRef, useState } from 'react';
import type { ChatInputProps } from './types';

export function ChatInput({ onSendMessage, isLoading = false, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  // biome-ignore lint/correctness/useExhaustiveDependencies: message dependency is needed for textarea resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);
  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 p-4 border-t border-divider bg-content1"
      aria-label="Send message form"
    >
      <div className="flex-1">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me about your SupplySense data..."
          minRows={1}
          maxRows={6}
          disabled={disabled}
          aria-label="Message input"
          classNames={{
            base: 'w-full',
            input: 'resize-none text-foreground',
            inputWrapper: 'bg-content2 border-divider',
          }}
        />
      </div>
      <Button
        type="submit"
        color="primary"
        isIconOnly
        isLoading={isLoading}
        disabled={!message.trim() || disabled}
        className="self-end"
        aria-label="Send message"
        size="lg"
      >
        {!isLoading && <SendIcon className="w-4 h-4" />}
      </Button>
    </form>
  );
}
