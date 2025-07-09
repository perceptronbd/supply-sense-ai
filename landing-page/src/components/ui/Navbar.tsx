'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';

const Navbar = () => {
  const pathname = usePathname();

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

  return (
    <nav className="container mx-auto flex justify-between items-center py-10 px-40">
      <Logo />

      <div className="flex gap-16 justify-between items-center">
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
