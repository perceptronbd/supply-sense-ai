'use client';

import './global.css';
import AuthProvider from '@/components/AuthProvider';
import MainLayout from '@/components/MainLayout';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SSRSafeDrawingLogo } from '@/components/ui/SSRSafeDrawingLogo';
import { persistor, store } from '@/store/store';
import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning={true} className="min-h-screen">
        <Provider store={store}>
          <PersistGate
            loading={
              <main className="min-h-screen flex items-center justify-center bg-background">
                <SSRSafeDrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
              </main>
            }
            persistor={persistor}
          >
            <AuthProvider>
              <ThemeProvider>
                <HeroUIProvider>
                  <MainLayout>{children}</MainLayout>
                  <ToastProvider placement="bottom-right" />
                </HeroUIProvider>
              </ThemeProvider>
            </AuthProvider>
          </PersistGate>
        </Provider>
      </body>
    </html>
  );
}
