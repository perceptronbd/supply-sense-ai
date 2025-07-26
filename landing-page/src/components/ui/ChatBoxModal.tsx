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
import { Send, User } from 'lucide-react';
import { useState } from 'react';
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

  const handleSubmit = async () => {
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
        base: 'max-h-[90vh] bg-background border-focus border-1',
        body: 'p-0',
        backdrop: '',
      }}
    >
      <ModalContent>
        {() => (
          <>
            {/* Header */}
            <ModalHeader className="flex items-center justify-between p-4">
              <FullLogo className="w-28 text-primary" />
              <Button
                onPress={() => handleClearChat()}
                variant="ghost"
                size="sm"
                className="text-sm border-none text-primary mr-5"
              >
                Clear Chat
              </Button>
            </ModalHeader>

            {/* Chat Messages */}
            <ModalBody className="flex flex-col h-[500px]">
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
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.sender === 'user' ? 'bg-primary/20' : 'bg-inherit'
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
                          icon={<User className="w-4 h-4" />}
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
            <ModalFooter className="p-4">
              <Form className="w-full border-none relative">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask anything about your business"
                  className="rounded-xl"
                  variant="flat"
                  size="lg"
                  classNames={{
                    base: '',
                    mainWrapper: '',
                    input: 'border-none bg-secondary placeholder:text-content3 placeholder:text-sm',
                    inputWrapper: 'bg-content1 border-2 border-primary rounded-xl',
                  }}
                />
                <Button
                  onPress={() => handleSubmit()}
                  type="submit"
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  className="border-none absolute right-0 top-2 -translate-x-5 bg-primary"
                >
                  <Send size={20} className="" />
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
