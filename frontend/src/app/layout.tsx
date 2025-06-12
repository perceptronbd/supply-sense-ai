'use client';

import './global.css';
import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { Provider } from 'react-redux';
import MainLayout from '../components/MainLayout';
import { StoreHydrator } from '../components/StoreHydrator';
import { ThemeProvider } from '../components/ThemeProvider';
import { store } from '../store/store';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning={true} className="min-h-screen bg-background text-foreground">
        <Provider store={store}>
          <StoreHydrator>
            <ThemeProvider>
              <HeroUIProvider>
                <MainLayout>{children}</MainLayout>
                <ToastProvider placement="bottom-right" />
              </HeroUIProvider>
            </ThemeProvider>
          </StoreHydrator>
        </Provider>
      </body>
    </html>
  );
}
