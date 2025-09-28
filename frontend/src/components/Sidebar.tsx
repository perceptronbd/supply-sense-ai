'use client';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { ROUTE_PATHS } from '@/config/routes';
import { useNavigation } from '@/hooks/useNavigation';
import { usePermissions } from '@/hooks/usePermissions';
import { Icons } from '@/lib/icons/Icons';
import { logout } from '@/store/slices/authSlice';
import { toggleTheme } from '@/store/slices/themeSlice';
import type { RootState } from '@/store/store';
import { Avatar, Button, Chip } from '@heroui/react';
import { CHAT_PERMISSIONS, USER_PERMISSIONS } from '@supplysense/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Text } from './ui/Text';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: Readonly<SidebarProps>) {
  const router = useRouter();
  const { isActive } = useNavigation();
  const { hasPermission } = usePermissions();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { theme: _ } = useSelector((state: RootState) => state.theme);
  const [showLogout, setShowLogout] = useState(false);
  const handleLogout = () => {
    dispatch(logout());
    router.push(ROUTE_PATHS.LOGIN);
  };

  const _handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  // Navigation items with permission checks
  const navigation = [
    {
      name: 'AI Chat',
      href: ROUTE_PATHS.CHAT,
      icon: <Icons.Message className="w-5 h-5" />,
      permission: CHAT_PERMISSIONS.SEND_MESSAGE,
    },
    {
      name: 'Connections',
      href: '#',
      icon: <Icons.Connection className="w-5 h-5" />,
      permission: USER_PERMISSIONS.READ,
    },
  ];

  // Filter navigation items based on user permissions
  const visibleNavigation = navigation.filter((item) => hasPermission(item.permission));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <input
          type="button"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          tabIndex={0}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0 bg-black
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <header className="flex items-center justify-between h-16 px-6 border-b rounded-t-xl border-divider">
            <BrandLogo showText={true} />
            {/* Theme toggle icon button */}
            {/* <div className="flex items-center gap-2">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="text-foreground hover:bg-content2"
                onPress={handleThemeToggle}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="p-1 transition-colors lg:hidden rounded-medium hover:bg-content2 text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </div> */}
          </header>
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <ul className="space-y-2">
              {visibleNavigation.map((item) => (
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
                          ? 'bg-primary/20 text-primary-primary text-primary-300'
                          : 'text-foreground hover:bg-content2 hover:text-foreground'
                      }
                    `}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <Text
                      variant="bodySmall"
                      weight="medium"
                      color={isActive(item.href) ? 'primary' : 'default'}
                      className="truncate"
                      as="p"
                    >
                      {item.name}
                    </Text>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          {/* User info and logout */}
          <footer className="p-4 border-t rounded-b-xl border-divider flex-shrink-0">
            <div className="flex items-center gap-x-4">
              {/* <Image
                src={'/avatar.png'}
                alt="User Avatar"
                width={56}
                height={56}
                className="object-cover size-full"
              /> */}
              <Avatar icon={<Icons.At />} />
              <div className="">
                <Text
                  variant="bodySmall"
                  weight="medium"
                  color="default"
                  className="truncate"
                  as="p"
                >
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text variant="bodyXSmall" color="muted" className="truncate max-w-28" as="p">
                  {user?.email}
                </Text>
                <Chip
                  classNames={{
                    base: 'text-primary-300',
                  }}
                  color="primary"
                  variant="flat"
                  size="sm"
                >
                  {user?.roles && user.roles.length > 0
                    ? user.roles.join(', ').replace(/_/g, ' ')
                    : 'No role assigned'}
                </Chip>
              </div>
              <button type="button" onClick={() => setShowLogout((prev) => !prev)}>
                <Icons.Down className="text-white" />
              </button>
            </div>
            {/* Logout button */}
            {showLogout && (
              <Button variant="flat" color="danger" className="w-full mt-4" onPress={handleLogout}>
                Logout
              </Button>
            )}
          </footer>
        </div>
      </aside>
    </>
  );
}
