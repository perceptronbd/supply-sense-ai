'use client';

import { Button } from '@heroui/react';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import type { RootState } from '../store/store';
import { ClipboardIcon, CloseIcon, DashboardIcon, DocumentIcon, InboxIcon } from './icons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <DashboardIcon className="w-5 h-5" />,
    },
    {
      name: 'Purchase Requests',
      href: '/purchase-requests',
      icon: <DocumentIcon className="w-5 h-5" />,
    },
    {
      name: 'Purchase Orders',
      href: '/purchase-orders',
      icon: <ClipboardIcon className="w-5 h-5" />,
    },
    {
      name: 'Goods Receipts',
      href: '/goods-receipts',
      icon: <InboxIcon className="w-5 h-5" />,
    },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {' '}
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          role="button"
          tabIndex={0}
        />
      )}{' '}
      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-background shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}
      >
        <div className="flex flex-col h-full">
          {' '}
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 bg-primary text-primary-foreground">
            <h2 className="text-lg font-semibold">Supply Chain AI</h2>{' '}
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1 rounded-md hover:bg-primary/20 transition-colors"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  router.push(item.href);
                  onClose();
                }}
                className={`
                  w-full flex items-center px-3 py-2 text-left text-sm font-medium rounded-md transition-colors duration-200
                  ${
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary border-r-2 border-primary'
                      : 'text-foreground hover:bg-default-100 hover:text-foreground'
                  }
                `}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </nav>{' '}
          {/* User info and logout */}
          <div className="border-t border-divider p-4">
            <div className="mb-4">
              <p className="text-sm font-medium text-foreground">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-default-500">{user?.email}</p>
              <p className="text-xs text-default-500">Role: {user?.role}</p>
            </div>
            <Button color="danger" variant="flat" className="w-full" onPress={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
