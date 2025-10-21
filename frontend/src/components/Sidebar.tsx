'use client';

import { Avatar, Button, Chip } from '@heroui/react';
import { CHAT_PERMISSIONS, USER_PERMISSIONS } from '@supplysense/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ROUTE_PATHS } from '@/config/routes';
import { useNavigation } from '@/hooks/useNavigation';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { Icons } from '@/lib/icons/Icons';
import { cn } from '@/lib/utils';
import { useGetSessionsQuery } from '@/store/api/chatApi';
import { logout } from '@/store/slices/authSlice';
import { setSessionId } from '@/store/slices/chatSlice';
import type { RootState } from '@/store/store';
import { ChatSessionList } from './ChatSessionList';
import { LogoWithName } from './ui/LogoWithName';
import { Text } from './ui/Text';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: Readonly<SidebarProps>) {
  const router = useRouter();
  const { isActive } = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [showLogout, setShowLogout] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Fetch sessions
  const {
    data: sessions = [],
    isLoading: isLoadingSessions,
    refetch: refetchSessions,
  } = useGetSessionsQuery({});

  // Handle session refresh when triggered by Redux state
  useSessionRefresh(refetchSessions);

  const handleLogout = () => {
    dispatch(logout());
    router.push(ROUTE_PATHS.LOGIN);
  };

  // Handle new chat button click
  const handleNewChat = async () => {
    dispatch(setSessionId(''));
    router.push(ROUTE_PATHS.CHAT);
    onClose();
  };

  // Navigation items with permission checks
  const navigation = [
    {
      name: 'New Chat',
      onClick: handleNewChat,
      icon: <Icons.EditV2 className="w-5 h-5" />,
      permission: CHAT_PERMISSIONS.SEND_MESSAGE,
    },
    {
      name: 'Connections',
      href: ROUTE_PATHS.CONNECTIONS,
      icon: <Icons.Connection className="w-5 h-5" />,
      permission: USER_PERMISSIONS.READ,
    },

    /** Add workflow automation when the feature is ready */
    // {
    //   name: 'Workflow Automation',
    //   href: '#',
    //   icon: <Icons.Workflow className="w-5 h-5" />,
    //   permission: USER_PERMISSIONS.READ,
    // },
  ];

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
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out',
          expanded ? 'md:w-[280px] w-full' : 'w-[80px]',
          'lg:translate-x-0 lg:static lg:inset-0 bg-black',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header with Logo and Toggle */}
          <header className="flex items-center h-16 px-6 gap-4">
            {expanded && <LogoWithName width={203} height={32} />}
            <div className="flex-1" />

            {/* Desktop ToggleSession button */}
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="hidden lg:flex border-none transition-colors hover:bg-transparent"
              aria-label="Toggle sessions list"
              onPress={() => setExpanded(!expanded)}
            >
              <Icons.ToggleSession className="w-6 h-6" />
            </Button>
          </header>

          {/* Navigation */}
          {expanded && (
            <nav className="px-4 py-6">
              <ul className="space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <button
                      type="button"
                      onClick={() => {
                        if (item.onClick) {
                          item.onClick();
                        } else if (item.href) {
                          router.push(item.href);
                          onClose();
                        }
                      }}
                      className="w-full flex items-center px-3 py-2 text-left font-medium group"
                    >
                      <span
                        className={cn(
                          'mr-3',
                          (item.name === 'New Chat' && isActive(ROUTE_PATHS.CHAT)) ||
                            (item.href && isActive(item.href))
                            ? 'text-primary-500'
                            : 'text-default-500 group-hover:text-default-foreground'
                        )}
                      >
                        {item.icon}
                      </span>

                      <Text
                        variant="bodySmall"
                        weight="medium"
                        className={cn(
                          'truncate',
                          (item.name === 'New Chat' && isActive(ROUTE_PATHS.CHAT)) ||
                            (item.href && isActive(item.href))
                            ? 'text-primary-300'
                            : 'text-default-500 group-hover:text-default-foreground'
                        )}
                        as="p"
                      >
                        {item.name}
                      </Text>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Chats Section */}
          {expanded && <ChatSessionList sessions={sessions} isLoading={isLoadingSessions} />}

          {/* Footer */}
          {expanded && (
            <footer className="flex-shrink-0 p-4 border-t rounded-b-xl border-divider">
              <div className="flex items-center gap-x-4">
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
              {showLogout && (
                <Button
                  variant="flat"
                  color="danger"
                  className="w-full mt-4"
                  onPress={handleLogout}
                >
                  Logout
                </Button>
              )}
            </footer>
          )}
        </div>
      </aside>
    </>
  );
}
