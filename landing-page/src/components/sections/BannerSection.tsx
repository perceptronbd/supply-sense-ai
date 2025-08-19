'use client';

import { Button, Card, CardBody, CardHeader, Input } from '@heroui/react';
import { ArrowRight, Send } from 'lucide-react';
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
      <h1 className="font-brand text-4xl md:text-6xl font-bold text-foreground text-center mx-auto">
        <span className="text-primary">Know </span>Your Operations.
        <br /> <span className="text-primary">Ask </span> Anything. <br />
        <span className="text-primary">Get </span>
        Instant Answers
      </h1>
      <p className="mt-4 mx-auto text-center text-content2-foreground px-6">
        Stop searching. Start asking. Real-time answers from your integrated systems.
      </p>

      <div className="flex flex-col justify-center items-center">
        <Button
          className="mt-10 mb-3 mx-auto"
          variant="solid"
          color="primary"
          radius="md"
          size="lg"
          endContent={<ArrowRight />}
        >
          Try For Free
        </Button>
        <p className="italic text-sm bg-clip-text text-transparent bg-gradient-to-r from-secondary-400 via-secondary-700 to-secondary-400 text-center mb-20">
          Only limited time - No credit cards required
        </p>
      </div>

      {/* chat box */}
      <div>
        <Card
          classNames={{
            base: 'bg-default-200',
          }}
          className=""
          style={{
            boxShadow: `
      -20px 0 20px -10px rgba(226, 204, 156, 0.15),  /* Left side - secondary */
      0 -20px 20px -10px rgba(226, 204, 156, 0.15),  /* Top side - secondary */
      20px 0 20px -10px rgba(232, 74, 46, 0.15),     /* Right side - primary */
      0 20px 20px -10px rgba(232, 74, 46, 0.15)      /* Bottom side - primary */
    `,
          }}
        >
          <CardHeader className="flex justify-between items-center px-6 py-4 relative">
            <FullLogo className="w-40 text-default" />
            {/* Glow effect - positioned inside the card header */}
            {/* <div className="absolute z-30 -bottom-[40%] left-1/2 -translate-x-1/2 w-[50vw] h-[45vw] rounded-full opacity-40 pointer-events-none bg-secondary/20 blur-xl" /> */}
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
