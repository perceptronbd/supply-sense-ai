'use client';

import { Button } from '@heroui/react';
import Link from 'next/link';
import { Icons } from '@/lib/icons/Icons';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';

export default function NotFoundContent() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <div className={cn('w-full bg-background', user ? 'h-full' : 'h-screen')}>
      <div className="w-full h-full flex flex-col  items-center justify-center px-4 text-center rounded-xl bg-content2 text-foreground relative overflow-hidden">
        <Icons.SadMascot className="w-32 md:w-40 text-primary drop-shadow-lg mb-0 md:mb-5" />

        <div className="space-y-3 max-w-md mb-5">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-display">
            Page not found
          </h1>
          <p className="text-lg text-default-500 leading-relaxed">
            The page you are looking for doesn't exist or has been moved to another location.
          </p>
        </div>

        <Button
          as={Link}
          href="/chat"
          color="primary"
          size="lg"
          startContent={<Icons.Message className="w-5 h-5" />}
        >
          Return to Chat
        </Button>
      </div>
    </div>
  );
}
