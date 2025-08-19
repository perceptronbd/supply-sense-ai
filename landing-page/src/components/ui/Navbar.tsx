'use client';

import { Button } from '@heroui/react';
import Link from 'next/link';
import { FullLogo } from './Logo';

const Navbar = () => {
  const navLinks = [
    {
      name: 'Features',
      href: '#',
    },
    {
      name: 'Use Cases',
      href: '#',
    },
    {
      name: 'Pricing',
      href: '#',
    },
    {
      name: 'Q&A',
      href: '#',
    },
    {
      name: 'Contact',
      href: '#',
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
            {link.name}
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
