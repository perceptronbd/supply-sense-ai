'use client';

import { Button, Card, CardBody } from '@heroui/react';
import { format } from 'date-fns';
import { PlusIcon } from '../icons';
import { Text } from '../ui/Text';
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
}: SessionListProps) {
  return (
    <aside
      className="w-64 border-r border-divider bg-content1 flex flex-col"
      aria-label="Chat sessions"
    >
      {/* Header */}
      <header className="p-4 border-b border-divider">
        <div className="flex items-center justify-between mb-4">
          <Text variant="titleSmall" weight="semiBold" color="default" as="h2">
            Chat Sessions
          </Text>
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onPress={onNewSession}
            disabled={isLoading}
            aria-label="Create new chat session"
          >
            <PlusIcon className="w-4 h-4" />
          </Button>
        </div>
      </header>
      {/* Sessions list */}
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Session navigation">
        {sessions.length === 0 && !isLoading ? (
          <div className="text-center py-8">
            <Text variant="bodySmall" color="muted" as="p">
              No chat sessions yet
            </Text>
            <Button size="sm" variant="flat" onPress={onNewSession} className="mt-2">
              Start New Chat
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {sessions.map((session) => (
              <li key={session.id}>
                <Card
                  isPressable
                  onPress={() => onSessionSelect(session.id)}
                  className={`cursor-pointer transition-colors ${
                    activeSessionId === session.id
                      ? 'bg-primary/10 border-primary'
                      : 'bg-content2 hover:bg-content3'
                  }`}
                >
                  <CardBody className="p-3">
                    <Text
                      variant="bodyMedium"
                      weight="medium"
                      color={activeSessionId === session.id ? 'primary' : 'default'}
                      className="line-clamp-2"
                      as="h3"
                    >
                      {session.title || 'New Chat'}
                    </Text>
                    <Text variant="bodyXSmall" color="muted" as="time" className="mt-1">
                      {(() => {
                        try {
                          const date = new Date(session.updatedAt);
                          return Number.isNaN(date.getTime())
                            ? 'Just now'
                            : format(date, 'MMM d, HH:mm');
                        } catch {
                          return 'Just now';
                        }
                      })()}
                    </Text>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}
