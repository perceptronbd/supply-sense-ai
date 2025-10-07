'use client';

import { HeroUIProvider } from '@heroui/react';
import { ThemeProvider } from 'next-themes';

const Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider
      attribute={'class'}
      defaultTheme="system"
      enableSystem
      themes={['light', 'dark']}
    >
      <HeroUIProvider>{children}</HeroUIProvider>
    </ThemeProvider>
  );
};

export default Provider;
