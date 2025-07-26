'use client';

import { Avatar, Button } from '@heroui/react';
import { User } from 'lucide-react';
import { useState } from 'react';
import { FullLogo, Logo } from './Logo';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const ChatBox = () => {
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'What items were requested in the last hour from Branch A?',
      sender: 'user',
      timestamp: new Date(),
    },
    {
      id: '2',
      content: '→ Item #412 (steel rods) x 50, requested by Anwar Hossain',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);

  return (
    <>
      {/* chat box */}
      <div className="w-full max-w-3xl mx-auto border-1 border-focus rounded-xl">
        <div className="bg-background rounded-2xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <FullLogo className="w-28 text-primary" />
            <Button variant="ghost" size="sm" className="text-sm border-none text-primary mr-5">
              Clear Chat
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
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
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatBox;
