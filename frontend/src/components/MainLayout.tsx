'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import Sidebar from './Sidebar';
import { MenuIcon } from './icons';
import { Text } from './ui/Text';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const pathname = usePathname();

  // Handle hydration mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Don't show sidebar on login page or if not authenticated
  const showSidebar = isHydrated && isAuthenticated && pathname !== '/login';

  // During SSR and before hydration, always render children without sidebar
  if (!isHydrated || !showSidebar) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top bar for mobile */}
        <header className="lg:hidden bg-content1 shadow-small border-b border-divider px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-medium text-default-500 hover:text-foreground hover:bg-content2 transition-colors"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          <Text variant="titleMedium" weight="semiBold" color="default" as="h1">
            SupplySense
          </Text>
        </header>{' '}
        {/* Main content */}
        <main className="flex-1 overflow-auto bg-background">{children}</main>
      </div>
    </div>
  );
}
