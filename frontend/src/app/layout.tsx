'use client';

import './global.css';
import AuthProvider from '@/components/AuthProvider';
import MainLayout from '@/components/MainLayout';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Loading } from '@/components/ui/Loading';
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
      <body suppressHydrationWarning={true} className="min-h-screen bg-background text-foreground">
        <Provider store={store}>
          <PersistGate
            loading={
              <main className="min-h-screen flex items-center justify-center bg-background">
                <Loading size="xl" message="Loading..." />
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
