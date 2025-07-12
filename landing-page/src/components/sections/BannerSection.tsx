'use client';

import { Button, Card, CardBody, CardHeader, Input } from '@heroui/react';
import { Send } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import logo from '../../../public/assets/full-logo.svg';
import SectionWrapper from '../ui/SectionWrapper';

const Banner = () => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Message:', message);
    setMessage('');
  };
  return (
    <SectionWrapper>
      <h1 className="font-display leading-snug text-3xl md:text-5xl font-bold text-foreground text-center mx-auto">
        Know Your Operations. Ask Anything. Get Instant Answers
      </h1>
      <p className="mt-4 mx-auto text-center text-foreground px-6 mb-24">
        Ask questions like “What’s low in stock at Branch A?” or “Who approved that PO last Friday?”
        — and get real answers from your data instantly.
      </p>

      {/* chat box */}
      <div>
        <Card className="border border-secondary-50 rounded-xl">
          <CardHeader className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Image src={logo} alt="logo" width={40} height={20} className="w-24" />
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-sm border-none text-secondary">
              Clear Chat
            </Button>
          </CardHeader>

          <CardBody className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="relative">
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
                type="submit"
                isIconOnly
                variant="ghost"
                size="sm"
                className="border-none absolute right-2 top-1/2 -translate-y-1/2 text-secondary mr-2"
              >
                <Send className="" />
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </SectionWrapper>
  );
};

export default Banner;
