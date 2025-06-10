'use client';

import './global.css';
import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { Provider } from 'react-redux';
import MainLayout from '../components/MainLayout';
import { StoreHydrator } from '../components/StoreHydrator';
import { store } from '../store/store';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <Provider store={store}>
          <StoreHydrator>
            <HeroUIProvider>
              <MainLayout>{children}</MainLayout>
              <ToastProvider placement="bottom-right" />
            </HeroUIProvider>
          </StoreHydrator>
        </Provider>
      </body>
    </html>
  );
}
