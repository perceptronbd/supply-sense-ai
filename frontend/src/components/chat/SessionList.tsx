'use client';

import { Loading, PlusIcon } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { Icons } from '@/lib/icons/Icons';
import { cn } from '@/lib/utils';
import { Button, Card, CardBody } from '@heroui/react';
import { useState } from 'react';
import type { ChatSession } from './types';

interface SessionListProps {
  sessions: ChatSession[];
  activeSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  isLoading?: boolean;
}

export function SessionList({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewSession,
  isLoading = false,
}: Readonly<SessionListProps>) {
  const [expanded, setExpanded] = useState(false);
  if (isLoading) {
    return <Loading />;
  }

  return (
    <aside
      aria-label="Chat sessions"
      className={cn(
        'flex-shrink-0 mr-2 max-w-[208px] overflow-y-auto no-scrollbar bottom-fade relative',
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
          onPress={() => setExpanded(!expanded)}
        >
          <Icons.ToggleSession />
        </Button>
      </header>

      <section className="flex flex-col gap-2">
        {expanded &&
          sessions.map((session) => (
            <Card key={session.id} aria-label="Session">
              <CardBody onClick={() => onSessionSelect(session.id)} className="cursor-pointer">
                <Text
                  variant="bodyMedium"
                  weight="medium"
                  color={session.id === activeSessionId ? 'primary' : 'default'}
                >
                  {session.title}
                </Text>
              </CardBody>
            </Card>
          ))}
      </section>
    </aside>
  );
}
