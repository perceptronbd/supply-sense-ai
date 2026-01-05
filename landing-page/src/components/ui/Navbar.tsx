'use client';

import { Button } from '@heroui/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icons } from '../icons';
import { FullLogo } from './Logo';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      const scrollPosition = window.scrollY + 100; // Offset for navbar height

      let currentSection = '';
      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          currentSection = section.id;
        }
      });
      setActiveSection(currentSection);
    };

    const handleHashChange = () => {
      const hash = globalThis.location.hash.substring(1);
      if (hash) {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          setActiveSection(hash);
        }
      }
    };

    // Initial checks
    handleHashChange();
    handleScroll();

    // Event listeners
    globalThis.addEventListener('hashchange', handleHashChange);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      globalThis.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('scroll', handleScroll);
    };
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
    // {
    //   name: 'Q&A',
    //   href: '#qna',
    // },
    {
      name: 'Contact',
      href: '#contact',
    },
  ];

  const loginUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/login`;

  return (
    <div className="bg-background/60 backdrop-blur-sm h-16 sticky top-0 z-50 pl-2 lg:pr-2 snap-start border-b border-white/5">
      <nav className="relative max-w-6xl flex justify-between flex-row items-center z-5 mx-auto h-full px-4">
        <Link href="/">
          <FullLogo width={173} height={27} />
        </Link>

        {/* Desktop menu */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = activeSection === link.href.substring(1);
            return (
              <Button
                key={link.name}
                size="sm"
                radius="full"
                variant={isActive ? 'flat' : 'light'}
                color={isActive ? 'primary' : 'default'}
                className={`text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground/70 hover:text-foreground hover:bg-default/40'
                }`}
                as={Link}
                href={link.href}
              >
                {link.name}
              </Button>
            );
          })}

          <a target="blank" href={loginUrl}>
            <Button
              size="sm"
              color="primary"
              radius="full"
              className="hover:scale-105 transition-transform duration-300 ml-6"
            >
              Login
            </Button>
          </a>
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
          className={`absolute top-full left-0 right-0 lg:hidden mt-2 mx-2 bg-background backdrop-blur-2xl border-1 border-primary/30 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out z-10 ${
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
              <a target="_blank" href={loginUrl}>
                <Button
                  fullWidth
                  size="md"
                  color="primary"
                  radius="lg"
                  className="hover:scale-105 transition-transform duration-200"
                  onPress={handleLinkClick}
                >
                  Login
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Backdrop overlay for mobile */}
        {isMobileMenuOpen && (
          <button
            type="button"
            aria-label="Close mobile navigation overlay"
            className="fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden z-[-1]"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </nav>
    </div>
  );
};

export default Navbar;
