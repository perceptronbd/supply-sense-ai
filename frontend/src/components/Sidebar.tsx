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
import { useCreateSessionMutation, useGetSessionsQuery } from '@/store/api/chatApi';
import { logout } from '@/store/slices/authSlice';
import type { RootState } from '@/store/store';
import { LogoWithName } from './ui/LogoWithName';
import { Text } from './ui/Text';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSessionId?: string;
  onSessionSelect?: (sessionId: string) => void;
  onSessionCreate?: (sessionId: string) => void;
  dbConnectionId?: string;
}

export default function Sidebar({
  isOpen,
  onClose,
  selectedSessionId,
  onSessionSelect,
  onSessionCreate,
  dbConnectionId,
}: Readonly<SidebarProps>) {
  const router = useRouter();
  const { isActive } = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [showLogout, setShowLogout] = useState(false);

  // Fetch sessions
  const {
    data: sessions = [],
    isLoading: isLoadingSessions,
    refetch: refetchSessions,
  } = useGetSessionsQuery({});

  // Create session mutation
  const [createSession, { isLoading: isCreatingSession }] = useCreateSessionMutation();

  // Handle session refresh when triggered by Redux state
  useSessionRefresh(refetchSessions);

  const handleLogout = () => {
    dispatch(logout());
    router.push(ROUTE_PATHS.LOGIN);
  };

  // Handle new chat button click
  const handleNewChat = async () => {
    if (!dbConnectionId) {
      router.push(ROUTE_PATHS.CHAT);
      onClose();
      return;
    }

    try {
      const sessionTitle = `Chat ${new Date().toLocaleString()}`;
      const newSession = await createSession({
        title: sessionTitle,
        description: 'New chat session',
        dbConnectionId,
      }).unwrap();

      onSessionCreate?.(newSession.id);
      onClose();
    } catch (error) {
      console.error('Failed to create new session:', error);
    }
  };

  // Extract the session content logic into a variable
  const sessionContent = (() => {
    if (isLoadingSessions || isCreatingSession) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-primary-300 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (sessions.length === 0) {
      return (
        <Text variant="bodyXSmall" className="text-default-500 px-3 py-4 text-center" as="p">
          No chats yet
        </Text>
      );
    }

    return (
      <ul className="space-y-1">
        {sessions.map((session) => (
          <li key={session.id}>
            <button
              type="button"
              onClick={() => {
                onSessionSelect?.(session.id);
                onClose();
              }}
              className="w-full flex flex-col px-3 py-2 text-left text-small font-medium group"
            >
              <Text
                variant="bodySmall"
                weight="medium"
                className={cn(
                  'truncate mb-1',
                  session.id === selectedSessionId
                    ? 'text-primary-primary text-primary-300'
                    : 'text-default-500 group-hover:text-default-foreground'
                )}
                as="p"
              >
                {session.title}
              </Text>
              <Text
                variant="bodyXSmall"
                className={cn(
                  session.id === selectedSessionId
                    ? 'text-primary-300/50'
                    : 'text-default-500 group-hover:text-default-foreground/70'
                )}
                as="p"
              >
                {new Date(session.createdAt)
                  .toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })
                  .toLowerCase()}{' '}
                {new Date(session.createdAt).toLocaleDateString('en-US', {
                  month: '2-digit',
                  day: '2-digit',
                  year: '2-digit',
                })}
              </Text>
            </button>
          </li>
        ))}
      </ul>
    );
  })();

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
      href: '#',
      icon: <Icons.Connection className="w-5 h-5" />,
      permission: USER_PERMISSIONS.READ,
    },
    {
      name: 'Workflow Automation',
      href: '#',
      icon: <Icons.Workflow className="w-5 h-5" />,
      permission: USER_PERMISSIONS.READ,
    },
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
          'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out w-[280px]',
          'lg:translate-x-0 lg:static lg:inset-0 bg-black',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header with Logo */}
          <header className="flex items-center justify-between h-16 px-6">
            <LogoWithName width={203} height={32} />
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="lg:hidden text-white"
              onPress={onClose}
              aria-label="Close sidebar"
            >
              <Icons.ToggleSession className="w-5 h-5" />
            </Button>
          </header>

          {/* Navigation */}
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
                        // Always show New Chat as primary, for others use conditional styling
                        item.name === 'New Chat' || (item.href && isActive(item.href))
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
                        // Always show New Chat as primary, for others use conditional styling
                        item.name === 'New Chat' || (item.href && isActive(item.href))
                          ? 'text-primary-primary text-primary-300'
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

          {/* Chats Section - Restructured for fixed header and scrollable content */}
          <section className="flex-1 flex flex-col min-h-0">
            {/* Fixed Chats Title */}
            <div className="flex-shrink-0 px-4 py-3">
              <Text variant="bodySmall" weight="medium" className="text-default-500" as="h2">
                Chats
              </Text>
            </div>

            {/* Scrollable Chat Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-2">{sessionContent}</div>
          </section>

          {/* User info and logout */}
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
