'use client';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { ROUTE_PATHS } from '@/config/routes';
import { useNavigation } from '@/hooks/useNavigation';
import { logout } from '@/store/slices/authSlice';
import { toggleTheme } from '@/store/slices/themeSlice';
import type { RootState } from '@/store/store';
import { Badge, Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  ChatIcon,
  ClipboardIcon,
  CloseIcon,
  DashboardIcon,
  DocumentIcon,
  InboxIcon,
  MoonIcon,
  SunIcon,
} from './icons';
import { Text } from './ui/Text';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const { isActive } = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { theme } = useSelector((state: RootState) => state.theme);

  const handleLogout = () => {
    dispatch(logout());
    router.push(ROUTE_PATHS.LOGIN);
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };
  const navigation = [
    {
      name: 'Dashboard',
      href: ROUTE_PATHS.DASHBOARD,
      icon: <DashboardIcon className="w-5 h-5" />,
    },
    {
      name: 'AI Chat',
      href: ROUTE_PATHS.CHAT,
      icon: <ChatIcon className="w-5 h-5" />,
    },
    {
      name: 'Purchase Requests',
      href: ROUTE_PATHS.PURCHASE_REQUESTS,
      icon: <DocumentIcon className="w-5 h-5" />,
    },
    {
      name: 'Purchase Orders',
      href: ROUTE_PATHS.PURCHASE_ORDERS,
      icon: <ClipboardIcon className="w-5 h-5" />,
    },
    {
      name: 'Goods Receipts',
      href: ROUTE_PATHS.GOODS_RECEIPTS,
      icon: <InboxIcon className="w-5 h-5" />,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-overlay/50 z-40 lg:hidden"
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          role="button"
          tabIndex={0}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-content1 rounded-xl m-3 shadow-large transform transition-transform duration-300 ease-in-out border border-divider
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <header className="flex items-center justify-between h-16 px-6 border-b border-divider rounded-t-xl">
            <BrandLogo showText={true} />
            <div className="flex items-center gap-2">
              {/* Theme toggle icon button */}
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="text-foreground hover:bg-content2"
                onPress={handleThemeToggle}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <SunIcon className="w-4 h-4" />
                ) : (
                  <MoonIcon className="w-4 h-4" />
                )}
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden p-1 rounded-medium hover:bg-content2 transition-colors text-foreground"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
          </header>
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <button
                    type="button"
                    onClick={() => {
                      router.push(item.href);
                      onClose();
                    }}
                    className={`
                      w-full flex items-center px-3 py-2 text-left text-small font-medium rounded-medium transition-colors duration-200
                      ${
                        isActive(item.href)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-content2 hover:text-foreground'
                      }
                    `}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          {/* User info and logout */}
          <footer className="border-t border-divider p-4 rounded-b-xl">
            <div className="mb-4 space-y-2">
              <Text variant="bodySmall" weight="medium" color="default" className="truncate" as="p">
                {user?.firstName} {user?.lastName}
              </Text>
              <Text variant="bodyXSmall" color="muted" className="truncate" as="p">
                {user?.email}
              </Text>
              <Badge color="secondary" variant="flat" size="sm">
                {user?.role?.replace(/_/g, ' ')}
              </Badge>
            </div>

            {/* Logout button */}
            <Button variant="flat" color="danger" className="w-full" onPress={handleLogout}>
              Logout
            </Button>
          </footer>
        </div>
      </aside>
    </>
  );
}
