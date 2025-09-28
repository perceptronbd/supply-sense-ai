'use client';

import { Loading, PlusIcon } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { Icons } from '@/lib/icons/Icons';
import { cn } from '@/lib/utils';
import { Button, Drawer, DrawerBody, DrawerContent, useDisclosure } from '@heroui/react';
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
}

export function SessionList({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewSession,
  isLoading = false,
  controlExpanded,
  onControlExpandedChange,
}: Readonly<SessionListProps>) {
  const [expanded, setExpanded] = useState(controlExpanded || false);
  if (isLoading) {
    return <Loading />;
  }

  return (
    <aside
      aria-label="Chat sessions"
      className={cn(
        'flex-shrink-0 mr-2 lg:max-w-[208px]  relative',
        expanded ? 'w-full' : 'w-auto'
      )}
    >
      <header className="flex items-center justify-between mb-5 sticky top-0 z-50 bg-background/40 backdrop-blur-sm">
        {expanded && (
          <button
            type="button"
            className="flex items-center gap-1 text-default-600"
            onClick={onNewSession}
          >
            <PlusIcon className="size-3" />{' '}
            <Text variant="bodyXSmall" weight="bold" className="text-default-600">
              Session
            </Text>
          </button>
        )}
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label="Toggle sessions list"
          className="text-secondary border-none"
          onPress={() => {
            setExpanded(!expanded);
            onControlExpandedChange?.(!expanded);
          }}
        >
          <Icons.ToggleSession />
        </Button>
      </header>

      <section className="flex flex-col gap-2">
        {expanded &&
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSessionSelect(session.id)}
              className="cursor-pointer max-w-full px-4 py-3 mb-1"
              type="button"
            >
              <Text
                variant="bodySmall"
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
}: Readonly<SessionListProps>) => {
  const { isOpen, onOpenChange } = useDisclosure();
  return (
    <>
      <Drawer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        backdrop="blur"
        hideCloseButton
        aria-label="Session List"
        classNames={{
          base: 'w-[100vw]',
          wrapper: 'w-[100vw]',
          body: 'w-[100vw]',
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
                  controlExpanded={isOpen}
                  onControlExpandedChange={onOpenChange}
                />
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
};
