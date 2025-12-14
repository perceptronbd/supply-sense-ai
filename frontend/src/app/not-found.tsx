import { Button } from '@heroui/react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Icons } from '@/lib/icons/Icons';

export const metadata: Metadata = {
  title: '404 – Page Not Found',
  description:
    'The page you are looking for could not be found. It may have been moved, deleted, or the URL is incorrect.',
};

export default function NotFound() {
  return (
    <div className="w-full h-full bg-background">
      <div className="w-full h-full flex flex-col items-center justify-center px-4 text-center rounded-xl bg-content2 text-foreground relative overflow-hidden">
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
