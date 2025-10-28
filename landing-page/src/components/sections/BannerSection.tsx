'use client';

import { Button, Card, CardBody, CardHeader, Input } from '@heroui/react';
import { useState } from 'react';
import { Icons } from '../icons';
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
      <h1 className="font-brand text-4xl lg:text-6xl font-medium lg:font-bold lg:text-foreground text-secondary text-center mx-auto">
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
          endContent={<Icons.ArrowRight />}
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
          className="card-blur-effect tilted-cylinder-glow"
        >
          <CardHeader className="flex justify-between items-center px-6 py-4 relative">
            <FullLogo className="w-40 text-default" />
          </CardHeader>
          <CardBody className="px-6 pb-6 relative z-10">
            {/* Glow effect - positioned inside the card header */}

            <form onSubmit={handleSubmit} className="relative">
              <Input
                onClick={() => setIsModalOpen(true)}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask anything about your business"
                radius="md"
                variant="flat"
                size="lg"
                classNames={{
                  input:
                    'placeholder:text-content3 placeholder:text-sm focus:outline-none focus:ring-0',
                  inputWrapper: 'bg-content1 py-8 card-blur-effect-alt',
                }}
              />
              <Button
                type="submit"
                radius="md"
                isIconOnly
                color="primary"
                variant="light"
                size="sm"
                className="w-10 h-10 absolute right-2 top-1/2 -translate-y-1/2 mr-2"
              >
                <Icons.SendIcon className="w-7 h-7" />
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
