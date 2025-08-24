'use client';

import { Button } from '@heroui/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icons } from '../icons';
import { FullLogo } from './Logo';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Close mobile menu when Button is clicked
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

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
    <div className="mx-2">
      <nav className="relative container flex justify-between flex-row items-center z-5 lg:bg-primary/20 border-1 border-primary/20 rounded-full mx-auto mt-5 py-1 lg:p-1">
        <FullLogo className="text-primary h-5 w-40 ml-4 lg:ml-0" />

        {/* Desktop menu */}

        <div className="hidden lg:flex gap-6 justify-center items-center">
          {navLinks.map((link) => (
            <Button
              key={link.name}
              size="sm"
              radius="md"
              variant="light"
              color="secondary"
              className="text-base font-normal hover:bg-primary/10 transition-all duration-200"
            >
              <Link href={link.href}>{link.name}</Link>
            </Button>
          ))}
        </div>

        <div className="hidden lg:flex gap-4 items-center">
          <Button
            size="sm"
            radius="full"
            variant="light"
            color="primary"
            className="text-base font-normal hover:bg-primary/10 transition-all duration-200"
          >
            <Link href={`${process.env.NEXT_PUBLIC_FRONTEND_URL}/login`}>Login</Link>
          </Button>
          <Button
            size="sm"
            color="primary"
            radius="full"
            className="hover:scale-105 transition-transform duration-300"
          >
            Try for free
          </Button>
        </div>

        {/* Mobile menu button */}
        <div className="lg:hidden mr-4">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            color="primary"
            className="hover:bg-primary/10 transition-all duration-300"
            onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {!isMobileMenuOpen ? (
              <Icons.List className="w-6 h-6" />
            ) : (
              <Icons.X className="w-6 h-6" />
            )}
          </Button>
        </div>

        {/* Mobile dropdown menu */}
        <div
          className={`absolute top-full left-0 right-0 lg:hidden mt-2 mx-2 backdrop-blur-2xl border-1 border-primary/20 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out z-10 ${
            isMobileMenuOpen
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
          style={{
            transformOrigin: 'top center',
            transform: isMobileMenuOpen ? 'scale(1)' : 'scale(0.95)',
          }}
        >
          <div className="p-4 flex flex-col gap-4 items-center">
            {/* Navigation Links */}
            <div className="space-y-1">
              {navLinks.map((link, index) => (
                <div
                  key={link.name}
                  className={`transform transition-all duration-300 ${
                    isMobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                  }`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <Button
                    fullWidth
                    size="md"
                    radius="lg"
                    variant="light"
                    color="secondary"
                    className="text-base font-normal justify-start hover:bg-primary/10 transition-all duration-200"
                    onPress={handleLinkClick}
                  >
                    <Link href={link.href} className="w-full text-left">
                      {link.name}
                    </Link>
                  </Button>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-primary/30 my-4 w-full" />

            <div
              className={`space-y-2 transform transition-all duration-300 ${
                isMobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
              }`}
              style={{ transitionDelay: `${navLinks.length * 50 + 100}ms` }}
            >
              <Button
                fullWidth
                size="md"
                radius="lg"
                variant="light"
                color="primary"
                className="text-base font-normal hover:bg-primary/10 transition-all duration-200"
                onPress={handleLinkClick}
              >
                <Link href={`${process.env.NEXT_PUBLIC_FRONTEND_URL}/login`}>Login</Link>
              </Button>
              <Button
                fullWidth
                size="md"
                color="primary"
                radius="lg"
                className="hover:scale-105 transition-transform duration-200"
                onPress={handleLinkClick}
              >
                Try for free
              </Button>
            </div>
          </div>
        </div>

        {/* Backdrop overlay for mobile */}
        {isMobileMenuOpen && (
          // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden z-[-1]"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </nav>
    </div>
  );
};

export default Navbar;
