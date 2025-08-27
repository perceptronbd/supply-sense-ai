'use client';
import { Icons } from '@/lib/icons/Icons';
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
    <div className="p-6 bg-background">
      <div className="mx-auto max-w-4xl">
        <form
          onSubmit={handleSubmit}
          className="relative rounded-xl border bg-content1 border-divider shadow-small"
          aria-label="Send message form"
        >
          <div className="flex gap-3 items-start p-4">
            {/* Text Input */}
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question or make a request..."
                minRows={1}
                maxRows={6}
                disabled={disabled}
                aria-label="Message input"
                variant="flat"
                classNames={{
                  base: 'w-full',
                  input: 'resize-none text-foreground text-medium bg-transparent',
                  inputWrapper: 'bg-transparent border-none shadow-none',
                }}
              />
            </div>

            {/* Send Button */}
            <Button
              type="submit"
              color="secondary"
              isIconOnly
              isLoading={isLoading}
              disabled={!message.trim() || disabled}
              className="mb-1 rounded-full rotate-45"
              aria-label="Send message"
              size="sm"
              variant="solid"
            >
              {!isLoading && <Icons.Send className="w-4 h-4" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
