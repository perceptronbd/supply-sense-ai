'use client';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { ROUTE_PATHS } from '@/config/routes';
import { useNavigation } from '@/hooks/useNavigation';
import { usePermissions } from '@/hooks/usePermissions';
import { logout } from '@/store/slices/authSlice';
import { toggleTheme } from '@/store/slices/themeSlice';
import type { RootState } from '@/store/store';
import { Button, Chip } from '@heroui/react';
import {
  BRANCH_PERMISSIONS,
  CHAT_PERMISSIONS,
  GOODS_RECEIPT_PERMISSIONS,
  ITEM_PERMISSIONS,
  PURCHASE_ORDER_PERMISSIONS,
  PURCHASE_REQUEST_PERMISSIONS,
  SUPPLIER_PERMISSIONS,
} from '@supplysense/types';
import {
  Building2,
  ClipboardList,
  Container,
  FileText,
  Inbox,
  MessageCircle,
  Moon,
  Package,
  Sun,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Text } from './ui/Text';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const { isActive } = useNavigation();
  const { hasPermission } = usePermissions();
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

  // Navigation items with permission checks
  const navigation = [
    {
      name: 'AI Chat',
      href: ROUTE_PATHS.CHAT,
      icon: <MessageCircle className="w-5 h-5" />,
      permission: CHAT_PERMISSIONS.SEND_MESSAGE,
    },

    {
      name: 'Branches',
      href: ROUTE_PATHS.BRANCHES,
      icon: <Building2 className="w-5 h-5" />,
      permission: BRANCH_PERMISSIONS.READ,
    },
    {
      name: 'Items',
      href: ROUTE_PATHS.ITEMS,
      icon: <Package className="w-5 h-5" />,
      permission: ITEM_PERMISSIONS.READ,
    },
    {
      name: 'Suppliers',
      href: ROUTE_PATHS.SUPPLIERS,
      icon: <Container className="w-5 h-5" />,
      permission: SUPPLIER_PERMISSIONS.READ,
    },
    {
      name: 'Purchase Requests',
      href: ROUTE_PATHS.PURCHASE_REQUESTS,
      icon: <FileText className="w-5 h-5" />,
      permission: PURCHASE_REQUEST_PERMISSIONS.READ,
    },
    {
      name: 'Purchase Orders',
      href: ROUTE_PATHS.PURCHASE_ORDERS,
      icon: <ClipboardList className="w-5 h-5" />,
      permission: PURCHASE_ORDER_PERMISSIONS.READ,
    },
    {
      name: 'Goods Receipts',
      href: ROUTE_PATHS.GOODS_RECEIPTS,
      icon: <Inbox className="w-5 h-5" />,
      permission: GOODS_RECEIPT_PERMISSIONS.READ,
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
          className="fixed inset-0 z-40 bg-overlay/50 lg:hidden"
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          tabIndex={0}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 rounded-xl mr-2  transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <header className="flex items-center justify-between h-16 px-6 border-b rounded-t-xl border-divider">
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
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="p-1 transition-colors lg:hidden rounded-medium hover:bg-content2 text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
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
                          ? 'bg-primary/20 text-primary-primary border-primary border'
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
          <footer className="p-4 border-t rounded-b-xl border-divider">
            <div className="mb-4 space-y-2">
              <Text variant="bodySmall" weight="medium" color="default" className="truncate" as="p">
                {user?.firstName} {user?.lastName}
              </Text>
              <Text variant="bodyXSmall" color="muted" className="truncate" as="p">
                {user?.email}
              </Text>
              <Chip color="secondary" variant="flat" size="sm">
                {user?.roles && user.roles.length > 0
                  ? user.roles.join(', ').replace(/_/g, ' ')
                  : 'No role assigned'}
              </Chip>
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
