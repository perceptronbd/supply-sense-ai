'use client';

import './global.css';
import { HeroUIProvider } from '@heroui/react';
import { Provider } from 'react-redux';
import MainLayout from '../components/MainLayout';
import { store } from '../store/store';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          <HeroUIProvider>
            <MainLayout>{children}</MainLayout>
          </HeroUIProvider>
        </Provider>
      </body>
    </html>
  );
}
