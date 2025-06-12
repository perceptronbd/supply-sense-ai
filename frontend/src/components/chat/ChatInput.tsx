'use client';

import { Button, Textarea } from '@heroui/react';
import { useEffect, useRef, useState } from 'react';
import { SendIcon } from '../icons';
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
      className="flex gap-2 p-4 border-t border-divider bg-background"
      aria-label="Send message form"
    >
      <div className="flex-1">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me about your supply chain data..."
          minRows={1}
          maxRows={6}
          disabled={disabled}
          aria-label="Message input"
          classNames={{
            base: 'w-full',
            input: 'resize-none',
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
      >
        {!isLoading && <SendIcon className="w-4 h-4" />}
      </Button>
    </form>
  );
}
