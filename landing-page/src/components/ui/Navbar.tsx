'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// import { useEffect, useRef } from "react";
// import { gsap } from "gsap";
import { FullLogo } from './Logo';

const Navbar = () => {
  const pathname = usePathname();
  // const navRef = useRef<HTMLElement>(null);

  const navLinks = [
    {
      name: 'Features',
      href: '/',
    },
    {
      name: 'Use Cases',
      href: '#',
    },
    {
      name: 'How It Works',
      href: '#',
    },
    {
      name: 'Contact',
      href: '/contact',
    },
  ];

  // useEffect(() => {
  //   if (!navRef.current) return;

  //   // Simple scale animation to test GSAP
  //   gsap.to(navRef.current, {
  //     scale: 1.02,
  //     duration: 2,
  //     repeat: -1,
  //     yoyo: true,
  //     ease: "power2.inOut",
  //   });

  //   // Background color animation
  //   gsap.to(navRef.current, {
  //     backgroundColor: "bg-background",
  //     duration: 3,
  //     repeat: -1,
  //     yoyo: true,
  //     ease: "power2.inOut",
  //   });

  //   return () => {
  //     gsap.killTweensOf(navRef.current);
  //   };
  // }, []);

  return (
    <nav
      // ref={navRef}
      className="relative container mx-auto flex justify-center flex-col lg:flex-row md:justify-between items-center py-10 md:px-20 2xl:px-40 overflow-hidden"
    >
      <FullLogo className="text-secondary" />

      <div className="flex flex-wrap gap-6 mt-10 lg:mt-0 md:gap-16 justify-center md:justify-between items-center">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className={`text-secondary font-data ${
              pathname === link.href
                ? 'text-secondary-foreground bg-secondary px-4 py-2 rounded-xl'
                : ''
            }`}
          >
            {link.name}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
