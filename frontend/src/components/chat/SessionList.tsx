'use client';

import { Loading, PlusIcon } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { Icons } from '@/lib/icons/Icons';
import { cn } from '@/lib/utils';
import { useAppDispatch } from '@/store/hooks';
import { setToggleValue } from '@/store/slices/commonSlice';
import { Button, Drawer, DrawerBody, DrawerContent } from '@heroui/react';
import { useState } from 'react';
import type { ChatSession } from './types';

interface SessionListProps {
  sessions: ChatSession[];
  activeSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  isLoading?: boolean;
  controlExpanded?: boolean;
  onControlExpandedChange?: (expanded: boolean) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isMobile?: boolean;
}

export function SessionList({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewSession,
  isLoading = false,
  controlExpanded,
  onControlExpandedChange,
  isMobile,
}: Readonly<SessionListProps>) {
  const [expanded, setExpanded] = useState(controlExpanded || false);
  const dispatch = useAppDispatch();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <aside
      aria-label="Chat sessions"
      className={cn(
        'flex-shrink-0 mr-2 lg:max-w-[208px] w-full bg-background max-lg:p-4 relative',
        expanded || isMobile ? 'w-full' : 'w-auto'
      )}
    >
      <header className="flex items-center justify-between mb-8 sticky top-0 z-50 bg-background py-1.5">
        {(expanded || isMobile) && (
          <Button size="lg" variant="light" color="default" onPress={onNewSession}>
            <PlusIcon className="size-3" />{' '}
            <Text variant="bodyBase" className="text-default-600">
              Session
            </Text>
          </Button>
        )}

        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label="Toggle sessions list"
          className="text-secondary border-none"
          onPress={() => {
            if (isMobile) {
              dispatch(setToggleValue({ sidebar: false }));
            } else {
              setExpanded(!expanded);
              onControlExpandedChange?.(!expanded);
            }
          }}
        >
          <Icons.ToggleSession />
        </Button>
      </header>

      <section className="flex flex-col gap-2 ">
        {(expanded || isMobile) &&
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSessionSelect(session.id)}
              className="cursor-pointer max-w-full px-4 py-3"
              type="button"
            >
              <Text
                variant="bodyMedium"
                weight="medium"
                color={session.id === activeSessionId ? 'secondary' : 'default'}
                className="mb-1 line-clamp-1 text-left"
              >
                {session.title}
              </Text>
              <Text
                variant="bodyXSmall"
                as="p"
                className={cn(
                  'text-left',
                  session.id === activeSessionId ? 'text-secondary/30' : 'text-default-500'
                )}
              >
                {new Date(session.createdAt)
                  .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                  .toLowerCase()}{' '}
                {new Date(session.createdAt).toLocaleDateString('en-US', {
                  month: '2-digit',
                  day: '2-digit',
                  year: '2-digit',
                })}
              </Text>
            </button>
          ))}
      </section>
    </aside>
  );
}

export const SessionListMobile = ({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewSession,
  isLoading = false,
  isOpen,
  onOpenChange,
}: Readonly<SessionListProps>) => {
  return (
    <>
      <Drawer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        backdrop="transparent"
        hideCloseButton
        aria-label="Session List"
        radius="none"
        classNames={{
          body: 'p-0',
        }}
      >
        <DrawerContent>
          {() => (
            <>
              <DrawerBody>
                <SessionList
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  onSessionSelect={onSessionSelect}
                  onNewSession={onNewSession}
                  isLoading={isLoading}
                  isMobile={true}
                />
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
};
