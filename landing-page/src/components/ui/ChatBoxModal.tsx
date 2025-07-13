'use client';

import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ScrollShadow,
} from '@heroui/react';
import { Bot, Send, User } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import logo from '../../../public/assets/full-logo.svg';

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
        base: 'max-h-[90vh] bg-background',
        header: 'border-b border-divider',
        body: 'p-0',
        footer: 'border-t border-divider',
        backdrop: 'bg-background/70',
      }}
    >
      <ModalContent>
        {() => (
          <>
            {/* Header */}
            <ModalHeader className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar
                    icon={<Bot className="w-5 h-5" />}
                    classNames={{
                      base: 'bg-default-800',
                      icon: 'text-primary',
                    }}
                    size="sm"
                  />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Supply Sense AI</h3>
                  <p className="text-sm text-content2-foreground">
                    Your intelligent supply chain assistant
                  </p>
                </div>
              </div>
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
                          icon={<Bot className="w-5 h-5" />}
                          classNames={{
                            base: 'bg-default-800',
                            icon: 'text-primary',
                          }}
                          size="sm"
                        />
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.sender === 'user'
                            ? 'bg-primary-500 text-primary-foreground'
                            : 'bg-content2 text-content2-foreground'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 opacity-70 ${
                            msg.sender === 'user'
                              ? 'text-primary-foreground'
                              : 'text-content3-foreground'
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
                        icon={<Bot className="w-4 h-4" />}
                        size="sm"
                        classNames={{
                          base: 'bg-secondary-100 flex-shrink-0',
                          icon: 'text-secondary-600',
                        }}
                      />
                      <div className="bg-content2 rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-content3-foreground rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-content3-foreground rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-content3-foreground rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollShadow>
            </ModalBody>

            {/* Input Footer */}
            <ModalFooter className="p-4">
              <Card className="border border-secondary-50 rounded-xl w-full">
                <CardHeader className="flex justify-between items-center px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Image src={logo} alt="logo" width={40} height={20} className="w-24" />
                    </div>
                  </div>
                  <Button
                    onPress={() => handleClearChat()}
                    variant="ghost"
                    size="sm"
                    className="text-sm border-none text-secondary"
                  >
                    Clear Chat
                  </Button>
                </CardHeader>

                <CardBody className="px-6 pb-6">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="content"
                    className="rounded-xl"
                    variant="flat"
                    size="lg"
                    classNames={{
                      input: 'border-none bg-secondary placeholder:text-secondary',
                      inputWrapper: 'bg-secondary-50',
                    }}
                  />
                  <Button
                    onPress={() => handleSubmit()}
                    type="submit"
                    isIconOnly
                    variant="ghost"
                    size="sm"
                    className="border-none absolute right-0 top-5 -translate-x-10 text-secondary"
                  >
                    <Send className="" />
                  </Button>
                </CardBody>
              </Card>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ChatBoxModal;
