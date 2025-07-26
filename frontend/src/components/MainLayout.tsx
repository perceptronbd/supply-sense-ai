'use client';

import type { RootState } from '@/store/store';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import { MenuIcon } from './icons';
import { Text } from './ui/Text';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: Readonly<MainLayoutProps>) {
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
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <div className="flex p-2 h-screen bg-content2 text-foreground">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex overflow-hidden flex-col flex-1 rounded-2xl lg:ml-0">
        {/* Top bar for mobile */}
        <header className="flex justify-between items-center px-4 py-3 border-b lg:hidden bg-content1 shadow-small border-divider">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 transition-colors rounded-medium text-default-500 hover:text-foreground hover:bg-content2"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          <Text variant="titleMedium" weight="semiBold" color="default" as="h1">
            SupplySense
          </Text>
        </header>
        {/* Main content */}
        <main className="overflow-auto flex-1 bg-background">{children}</main>
      </div>
    </div>
  );
}
