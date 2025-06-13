'use client';

import './global.css';
import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import AuthProvider from '../components/AuthProvider';
import MainLayout from '../components/MainLayout';
import { ThemeProvider } from '../components/ThemeProvider';
import { persistor, store } from '../store/store';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning={true} className="min-h-screen bg-background text-foreground">
        {' '}
        <Provider store={store}>
          <PersistGate
            loading={
              <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  <div className="text-foreground text-sm">Loading...</div>
                </div>
              </div>
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
