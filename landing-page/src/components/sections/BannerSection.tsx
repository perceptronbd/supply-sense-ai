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
        Ask questions like "What's low in stock at Branch A?" or "Who approved that PO last Friday?"
        — and get real answers from your data instantly.
      </p>

      {/* chat box */}
      <div>
        <Card
          classNames={{
            base: 'bg-background backdrop-blur-[10px]',
          }}
          className="border border-focus rounded-xl relative overflow-hidden"
        >
          <CardHeader className="flex justify-between items-center px-6 py-4 relative">
            <FullLogo className="w-24 text-primary" />

            {/* Glow effect - positioned inside the card header */}
            <div className="absolute z-30 -bottom-[40%] left-1/2 -translate-x-1/2 w-[50vw] h-[45vw] rounded-full opacity-40 pointer-events-none bg-secondary/20 blur-xl" />

            <Button
              onPress={() => setMessage('')}
              variant="ghost"
              size="sm"
              className="text-sm border-none text-primary relative z-10"
            >
              Clear Chat
            </Button>
          </CardHeader>

          <CardBody className="px-6 pb-6 relative z-10">
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
                  inputWrapper: 'bg-content1 border-1 border-primary py-8',
                }}
              />
              <Button
                type="submit"
                radius="lg"
                isIconOnly
                variant="ghost"
                size="sm"
                className="w-10 h-10 border-none absolute right-2 top-1/2 -translate-y-1/2 bg-primary mr-2"
              >
                <Send size={20} className="" />
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
