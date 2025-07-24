'use client';

import { Button, Card, CardBody, CardHeader, Input } from '@heroui/react';
import { Send } from 'lucide-react';
import { useState } from 'react';
import ChatBoxModal from '../ui/ChatBoxModal';
import { FullLogo } from '../ui/Logo';
import SectionWrapper from '../ui/SectionWrapper';

const Banner = () => {
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Message:', message);
    setMessage('');
  };

  return (
    <SectionWrapper>
      {/* logo */}
      <div className="mx-auto text-center mb-16 mt-4 flex justify-center items-center">
        <FullLogo className="w-96 text-primary" />
      </div>

      <h1 className="font-brand text-4xl md:text-5xl font-bold text-foreground text-center mx-auto bg-clip-text text-transparent bg-gradient-to-r from-content1-foreground to-focus ">
        Know Your Operations. Ask Anything. Get Instant Answers
      </h1>
      <p className="mt-4 mx-auto text-center text-content2-foreground px-6 mb-20">
        Ask questions like “What’s low in stock at Branch A?” or “Who approved that PO last Friday?”
        — and get real answers from your data instantly.
      </p>

      {/* chat box */}
      <div>
        <Card
          classNames={{
            base: 'bg-background',
          }}
          className="border border-focus rounded-xl"
        >
          <CardHeader className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <FullLogo className="w-24 text-primary" />
              </div>
            </div>
            <Button
              onPress={() => setMessage('')}
              variant="ghost"
              size="sm"
              className="text-sm border-none text-primary"
            >
              Clear Chat
            </Button>
          </CardHeader>

          <CardBody className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="relative">
              <Input
                onClick={() => setIsModalOpen(true)}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask anything about your business"
                className="rounded-xl"
                variant="flat"
                size="lg"
                classNames={{
                  input: 'placeholder:text-content3 placeholder:text-sm',
                  inputWrapper: 'bg-content1 border-1 border-primary',
                }}
              />
              <Button
                type="submit"
                isIconOnly
                variant="ghost"
                size="sm"
                className="border-none absolute right-2 top-1/2 -translate-y-1/2 text-primary mr-2"
              >
                <Send className="" />
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>

      {/* Chat Modal */}
      <ChatBoxModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOpenChange={setIsModalOpen}
      />
    </SectionWrapper>
  );
};

export default Banner;
