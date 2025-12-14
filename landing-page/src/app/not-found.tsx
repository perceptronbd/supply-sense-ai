import { Button } from '@heroui/react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Icons } from '../components/icons/Icons';
import Footer from '../components/ui/Footer';
import Navbar from '../components/ui/Navbar';

export const metadata: Metadata = {
  title: '404 – Page Not Found',
  description:
    'The page you are looking for could not be found. It may have been moved, deleted, or the URL is incorrect.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 py-20">
        <div className="max-w-3xl w-full text-center space-y-10 animate-appearance-in">
          <Icons.SadMascot className="w-32 md:w-40 mx-auto" />

          <div className="space-y-6 max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-brand font-bold tracking-tight">
              Page Not Found
            </h1>

            <p className="text-default-500 text-base md:text-lg leading-relaxed max-w-lg mx-auto">
              The page you're looking for seems to have gone on an adventure without us. Let's get
              you back to familiar territory.
            </p>
          </div>

          <Button as={Link} href="/" color="primary" size="lg">
            Return Home
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
