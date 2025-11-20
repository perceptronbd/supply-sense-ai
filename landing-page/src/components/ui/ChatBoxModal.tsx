'use client';

import {
  Avatar,
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import { FormEvent, memo, useCallback, useEffect, useRef, useState } from 'react';
import { sendPublicMessage } from '../../app/actions/chatActions';
import { Icons } from '../icons';
import { LoadingMessage } from './LoadingMessage';
import { MascotAwake } from './Logo';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
}

// Memoized message bubble to avoid full list rerenders
const MessageBubble = memo(({ msg }: { msg: ChatMessage }) => {
  return (
    <div className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      {msg.sender === 'ai' && <MascotAwake size={36} className="text-primary" />}

      <div
        className={`max-w-[80%] rounded-2xl px-4 ${
          msg.sender === 'user'
            ? 'bg-gradient-to-l from-default-300 to-default-400 py-3'
            : 'bg-inherit'
        }`}
      >
        <p className="text-sm leading-relaxed">{msg.content}</p>
        <p className="text-xs mt-1 opacity-70 text-content1-foreground">
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {msg.sender === 'user' && (
        <Avatar
          icon={<Icons.User className="w-4 h-4" />}
          size="sm"
          classNames={{
            base: 'bg-primary-100 flex-shrink-0',
            icon: 'text-primary-600',
          }}
        />
      )}
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';

// main component
const ChatBoxModal = ({ isOpen, onOpenChange }: ChatBoxModalProps) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    const scrollToEnd = () => {
      if (messagesContainerRef.current) {
        const scrollElement = messagesContainerRef.current;
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    };

    scrollToEnd();
    const timer = setTimeout(scrollToEnd, 10);

    return () => clearTimeout(timer);
  }, [messages]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!message.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: message,
        sender: 'user',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setMessage('');
      setIsLoading(true);

      try {
        // Call the server action
        const result = await sendPublicMessage(userMessage.content);

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: result.message,
          sender: 'ai',
          timestamp: new Date(result.timestamp),
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        // Handle error
        console.error('Error in handleSubmit:', error);
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: 'Sorry, I am unable to process your request. Please try again.',
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [message, isLoading]
  );

  // Handle chat clearing
  const handleClearChat = useCallback(() => {
    setMessages([]);
    setMessage('');
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      closeButton={false}
      scrollBehavior="inside"
      classNames={{
        base: 'max-h-[90vh] bg-default-200 relative card-blur-effect tilted-cylinder-glow',
        body: 'p-0',
      }}
    >
      <ModalContent>
        {() => (
          <>
            {/* Header */}
            <ModalHeader>
              <Button
                onPress={handleClearChat}
                variant="flat"
                color="default"
                radius="md"
                size="sm"
              >
                Clear Chat
              </Button>
            </ModalHeader>

            {/* Chat Messages */}
            <ModalBody className="flex flex-col h-[500px] relative z-10">
              <div className="flex-1 px-4 py-2 overflow-y-auto" ref={messagesContainerRef}>
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} />
                  ))}

                  {isLoading && <LoadingMessage />}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            </ModalBody>

            {/* Input Footer */}
            <ModalFooter className="p-4 relative z-10">
              <Form
                aria-label="Chat Form"
                onSubmit={handleSubmit}
                className="w-full border-none relative"
              >
                <Input
                  aria-label="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask anything about your business"
                  radius="md"
                  variant="flat"
                  size="lg"
                  disabled={isLoading}
                  classNames={{
                    input:
                      'border-none placeholder:text-content4 placeholder:text-sm w-[90%] focus:outline-none focus:ring-0',
                    inputWrapper: 'bg-content1 rounded-xl py-8 card-blur-effect-alt',
                  }}
                />

                <Button
                  type="submit"
                  radius="md"
                  isIconOnly
                  variant="light"
                  color="primary"
                  size="sm"
                  className="w-10 h-10 absolute right-2 top-1/2 -translate-y-1/2 mr-2"
                  disabled={isLoading}
                >
                  <Icons.SendIcon className="w-7 h-7" />
                </Button>
              </Form>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ChatBoxModal;
