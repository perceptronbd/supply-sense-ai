'use client';

import './global.css';
import AuthProvider from '@/components/AuthProvider';
import MainLayout from '@/components/MainLayout';
import { ThemeProvider } from '@/components/ThemeProvider';
import ClarityProvider from '@/components/analytics/Clarity';
import { SSRSafeDrawingLogo } from '@/components/ui/SSRSafeDrawingLogo';
import { cn } from '@/lib/utils';
import { persistor, store } from '@/store/store';
import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { Manrope, Montserrat } from 'next/font/google';
import localFont from 'next/font/local';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
});
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });
const clashDisplay = localFont({
  src: [
    {
      path: './fonts/ClashDisplay-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/ClashDisplay-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-clash-display',
});
export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(montserrat.variable, manrope.variable, clashDisplay.variable)}
    >
      <head>
        <title>SupplySense AI - Supply Chain Management</title>
        <meta
          name="description"
          content="AI-powered supply chain management system for modern businesses"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Favicon - use SupplySense ICO file */}
        <link rel="icon" href="/supply-sense.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/supply-sense.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/supply-sense.ico" />
        <link rel="icon" href="/logo.svg?v=2" type="image/svg+xml" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0A2538" />
      </head>
      <body suppressHydrationWarning={true} className={'min-h-screen'}>
        {/* Microsoft Clarity Analytics */}
        <ClarityProvider projectId={process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID} />

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
