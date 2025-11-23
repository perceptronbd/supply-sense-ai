'use client';

import {
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { sendPublicMessage } from '../../app/actions/chatActions';
import { Icons as SendIcons } from '../icons';
import AIMessage from './AIMessage';
import { LoadingMessage } from './LoadingMessage';
import { PublicSampleQuestions } from './PublicSampleQuestions';
import UserMessage from './UserMessage';

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

// main chat component
const ChatBoxModal = ({ isOpen, onOpenChange }: ChatBoxModalProps) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      for (const timeout of Object.values(timeoutRefs.current)) {
        clearTimeout(timeout);
      }
    };
  }, []);

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
    setCopied({});

    // Clear all timeouts
    for (const timeout of Object.values(timeoutRefs.current)) {
      clearTimeout(timeout);
    }
    timeoutRefs.current = {};
  }, []);

  // Handle copy Message
  const handleCopyMessage = useCallback(async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);

      // Set copied true for this specific message
      setCopied((prev) => ({ ...prev, [id]: true }));

      // Clear previous timeout if exists
      if (timeoutRefs.current[id]) {
        clearTimeout(timeoutRefs.current[id]);
      }

      // Create a new timeout to reset copied state
      timeoutRefs.current[id] = setTimeout(() => {
        setCopied((prev) => ({ ...prev, [id]: false }));
        delete timeoutRefs.current[id];
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      closeButton={false}
      scrollBehavior="inside"
      placement="center"
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
              <div
                ref={messagesContainerRef}
                className="flex-1 px-4 py-3 overflow-y-auto space-y-4"
              >
                {messages.map((msg) =>
                  msg.sender === 'user' ? (
                    <div key={msg.id} className="flex justify-end">
                      <UserMessage
                        content={msg.content}
                        onCopy={() => handleCopyMessage(msg.id, msg.content)}
                        copied={!!copied[msg.id]}
                      />
                    </div>
                  ) : (
                    <AIMessage
                      key={msg.id}
                      msg={msg}
                      onCopy={() => handleCopyMessage(msg.id, msg.content)}
                      copied={!!copied[msg.id]}
                    />
                  )
                )}

                {isLoading && <LoadingMessage />}
              </div>
            </ModalBody>

            {/* Input Footer */}
            <ModalFooter className="p-4 relative z-10">
              <div className="flex flex-col w-full gap-3">
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
                    disabled={isLoading}
                    className="w-10 h-10 absolute right-2 top-1/2 -translate-y-1/2 mr-2"
                  >
                    <SendIcons.SendIcon className="w-7 h-7" />
                  </Button>
                </Form>

                {/* Sample Questions */}
                {messages.length === 0 && (
                  <div className="max-h-[160px] overflow-y-auto sm:max-h-none sm:overflow-visible">
                    <PublicSampleQuestions onQuestionClick={(q) => setMessage(q)} />
                  </div>
                )}
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ChatBoxModal;
