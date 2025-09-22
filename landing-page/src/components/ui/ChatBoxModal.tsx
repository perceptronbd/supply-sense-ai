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
  ScrollShadow,
} from '@heroui/react';
import { FormEvent, useState } from 'react';
import { Icons } from '../icons';
import { FullLogo, Logo } from './Logo';

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

const ChatBoxModal = ({ isOpen, onOpenChange }: ChatBoxModalProps) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hello! I'm your Supply Sense AI assistant. How can I help you today?",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'I understand your question. Let me help you with that supply chain query.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: '1',
        content: "Hello! I'm your Supply Sense AI assistant. How can I help you today?",
        sender: 'ai',
        timestamp: new Date(),
      },
    ]);
    setMessage('');
  };

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
            <ModalHeader className="flex items-center justify-between p-4">
              <FullLogo className="w-40 text-default" />
              <Button
                onPress={() => handleClearChat()}
                variant="light"
                color="default"
                radius="md"
                size="sm"
                className="text-sm text-default mr-5"
              >
                Clear Chat
              </Button>
            </ModalHeader>

            {/* Chat Messages */}
            <ModalBody className="flex flex-col h-[500px] relative z-10">
              <ScrollShadow className="flex-1 px-4 py-2">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {/* ai message */}
                      {msg.sender === 'ai' && (
                        <Avatar
                          icon={<Logo className="w-5 text-primary" />}
                          classNames={{
                            base: 'bg-background',
                            icon: 'text-primary',
                          }}
                          size="sm"
                        />
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-l from-default-300 to-default-400 py-3'
                            : 'bg-inherit'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 opacity-70 ${
                            msg.sender === 'user'
                              ? 'text-content1-foreground'
                              : 'text-content1-foreground'
                          }`}
                        >
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      {/* user message */}
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
                  ))}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <Avatar
                        icon={<Logo className="w-5 text-primary" />}
                        classNames={{
                          base: 'bg-background',
                          icon: 'text-primary',
                        }}
                        size="sm"
                      />
                      <div className="bg-inherit rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-content1-foreground rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-content1-foreground rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-content1-foreground rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollShadow>
            </ModalBody>

            {/* Input Footer */}
            <ModalFooter className="p-4 relative z-10">
              <Form onSubmit={handleSubmit} className="w-full border-none relative">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask anything about your business"
                  radius="md"
                  variant="flat"
                  size="lg"
                  classNames={{
                    input: 'border-none placeholder:text-content4 placeholder:text-sm w-[90%]',
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
