'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Icons } from '@/lib/icons/Icons';
import { useAppDispatch } from '@/store/hooks';
import { setToggleValue } from '@/store/slices/commonSlice';
import type { RootState } from '@/store/store';
import Sidebar from './Sidebar';
import { LogoWithName } from './ui/LogoWithName';
import { Text } from './ui/Text';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: Readonly<MainLayoutProps>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [openMobileSidebar, setOpenMobileSidebar] = useState(false);

  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const handleOpenSidebar = () => {
    setOpenMobileSidebar(!openMobileSidebar);
    dispatch(setToggleValue({ sidebar: !openMobileSidebar }));
  };

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
    <div className="flex p-2 h-screen  text-foreground">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex overflow-hidden flex-col flex-1 rounded-sm lg:ml-0">
        {/* Top bar for mobile */}
        <header className="flex justify-between items-center px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 transition-colors rounded-medium text-default-500 hover:text-foreground hover:bg-content2"
            >
              <Icons.ChevronRight className="size-8 text-default-800" />
            </button>
            <Text
              variant="titleMedium"
              weight="semiBold"
              color="default"
              as="h1"
              className="flex items-center gap-2"
            >
              {/* <LogoIcon size={30} />
              <Text
                variant="titleMedium"
                weight="semiBold"
                color="default"
                as="span"
                className="uppercase"
              >
                Supply Sense
              </Text> */}
              <LogoWithName width={203} height={32} />
            </Text>
          </div>
          {/* <button onClick={handleOpenSidebar} type="button">
            <Icons.ToggleSession className="size-8 text-secondary-500" />
          </button> */}
        </header>
        {/* Main content */}
        <main className="overflow-auto flex-1 bg-content2">{children}</main>
      </div>
    </div>
  );
}
