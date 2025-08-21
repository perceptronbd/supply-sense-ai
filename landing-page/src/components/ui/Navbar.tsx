'use client';

import { Button } from '@heroui/react';
import Link from 'next/link';
import { useEffect } from 'react';
import { FullLogo } from './Logo';

const Navbar = () => {
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    // Handle initial load
    handleHashChange();

    // Handle hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navLinks = [
    {
      name: 'Features',
      href: '#features',
    },
    {
      name: 'Use Cases',
      href: '#use-cases',
    },
    {
      name: 'Pricing',
      href: '#pricing',
    },
    {
      name: 'Q&A',
      href: '#qna',
    },
    {
      name: 'Contact',
      href: '#contact',
    },
  ];

  return (
    <nav className="relative container mx-auto flex justify-center lg:justify-between flex-col lg:flex-row items-center bg-primary/20 mt-5 border-1 border-primary/20 lg:rounded-full py-5 lg:py-1 px-1">
      <FullLogo className="text-primary h-5 w-40" />

      <div className="flex flex-wrap gap-4 my-5 lg:my-0 lg:gap-6 justify-center items-center">
        {navLinks.map((link) => (
          <Button
            key={link.name}
            size="sm"
            radius="md"
            variant="light"
            color="secondary"
            className="text-base font-normal"
          >
            <Link href={link.href}>{link.name}</Link>
          </Button>
        ))}
      </div>

      <div className="flex gap-4 items-center">
        <Button
          size="sm"
          radius="full"
          variant="light"
          color="primary"
          className="text-base font-normal"
        >
          <Link href={`${process.env.NEXT_PUBLIC_FRONTEND_URL}/login`}>Login</Link>
        </Button>
        <Button size="sm" color="primary" radius="full">
          Try for free
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
