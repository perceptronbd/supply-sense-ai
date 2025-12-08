'use client';

import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { ThemeProvider } from 'next-themes';

const Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider
      attribute={'class'}
      defaultTheme="system"
      enableSystem
      themes={['light', 'dark']}
    >
      <HeroUIProvider>
        {children}
        <ToastProvider placement="bottom-right" />
      </HeroUIProvider>
    </ThemeProvider>
  );
};

export default Provider;
