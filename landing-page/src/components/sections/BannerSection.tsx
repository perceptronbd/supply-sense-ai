'use client';

import { Button, Input } from '@heroui/react';
import { useState } from 'react';
import { Icons } from '../icons';
import ChatBoxModal from '../ui/ChatBoxModal';
import SectionWrapper from '../ui/SectionWrapper';

const Banner = () => {
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim()) {
      setIsModalOpen(true);
    }
  };

  //navigate to login page
  const handleInputClick = () => {
    const loginUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/login`;
    window.open(loginUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <SectionWrapper className="md:min-h-screen md:flex md:flex-col md:justify-center snap-center pt-24">
      <h1 className="mx-auto text-4xl font-medium text-center font-brand lg:text-6xl lg:font-bold lg:text-foreground text-secondary">
        <span className="text-primary">Know </span>Your Operations.
        <br /> <span className="text-primary">Ask </span> Anything. <br />
        <span className="text-primary">Get </span>
        Instant Answers
      </h1>
      <p className="px-6 mx-auto mt-4 text-center text-content2-foreground">
        Stop searching. Start asking. Real-time answers from your integrated systems.
      </p>

      <div className="flex flex-col items-center justify-center">
        <Button
          className="mx-auto mt-10 mb-3"
          variant="solid"
          color="primary"
          radius="md"
          size="lg"
          endContent={<Icons.ArrowRight />}
          onPress={() => handleInputClick()}
        >
          Try For Free
        </Button>
        <p className="mb-20 text-sm italic text-center text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 via-secondary-700 to-secondary-400">
          Only limited time - No credit cards required
        </p>
      </div>

      {/* chat box */}
      <div>
        <form onSubmit={handleSubmit} className="relative">
          <Input
            aria-label="Ask anything about your business"
            // onClick={handleInputClick}
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
            variant="flat"
            size="sm"
            className="absolute w-10 h-10 mr-2 -translate-y-1/2 right-2 top-1/2"
          >
            <Icons.SendIcon className="w-7 h-7 text-primary" />
          </Button>
        </form>
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
