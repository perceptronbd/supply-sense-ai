'use client';
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Textarea,
} from '@heroui/react';
import { useEffect, useRef, useState } from 'react';
import { Icons } from '@/lib/icons/Icons';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import type { ChatInputProps } from './types';

export function ChatInput({
  onSendMessage,
  isLoading = false,
  disabled = false,
  message,
  setMessage,
}: Readonly<ChatInputProps>) {
  const [selectedConnection, setSelectedConnection] = useState('Select Connection');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sessionId } = useAppSelector((state) => state.chat);

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

  const connections = ['Connection 1', 'Connection 2', 'Connection 3'];

  return (
    <section
      className={cn('pb-7 px-10 w-full  z-30', sessionId ? 'fixed lg:absolute bottom-0' : '')}
    >
      <form
        onSubmit={handleSubmit}
        className="relative rounded-xl border bg-content1 border-divider shadow-small"
        aria-label="Send message form"
      >
        {/* Textarea Row */}
        <div className="p-3 pb-2">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your data..."
            minRows={1}
            maxRows={6}
            disabled={disabled}
            aria-label="Message input"
            variant="flat"
            classNames={{
              base: 'w-full',
              input:
                'resize-none text-foreground text-medium max-h-96 bg-transparent focus:outline-none focus:ring-0',
              inputWrapper:
                'bg-transparent border-none shadow-none p-0 data-[hover=true]:bg-transparent',
            }}
          />
        </div>

        {/* Dropdowns and Send Button Row */}
        <div className="flex gap-2 items-center justify-between px-3 pb-3 pt-1">
          <div className="flex gap-2 items-center">
            <Dropdown>
              <DropdownTrigger>
                <Button
                  variant="flat"
                  radius="md"
                  startContent={<Icons.Connection className="w-4 h-4" />}
                  endContent={<Icons.Down className="w-4 h-4" />}
                  size="sm"
                >
                  {selectedConnection}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Connection options"
                onAction={(key) => setSelectedConnection(key as string)}
              >
                {connections.map((connection) => (
                  <DropdownItem key={connection}>{connection}</DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            {/* <Button
              variant="flat"
              radius="md"
              startContent={<Icons.Plus className="w-4 h-4" />}
              size="sm"
            >
              Mode
            </Button> */}
          </div>

          <Button
            type="submit"
            color="secondary"
            isIconOnly
            isLoading={isLoading}
            disabled={!message.trim() || disabled}
            aria-label="Send message"
            size="sm"
            variant="solid"
          >
            {!isLoading && <Icons.Send className="w-4 h-4 -rotate-45" />}
          </Button>
        </div>
      </form>
    </section>
  );
}
