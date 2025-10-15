import { cn } from '@/lib/utils';
import { Text } from './ui/Text';

interface Session {
  id: string;
  title: string;
  createdAt: string;
}

interface ChatSessionListProps {
  sessions: Session[];
  selectedSessionId?: string;
  isLoading: boolean;
  onSessionSelect: (sessionId: string) => void;
}

export function ChatSessionList({
  sessions,
  selectedSessionId,
  isLoading,
  onSessionSelect,
}: Readonly<ChatSessionListProps>) {
  const sessionContent = (() => {
    if (isLoading) {
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
              onClick={() => onSessionSelect(session.id)}
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

  return (
    <section className="flex-1 flex flex-col min-h-0">
      <div className="flex-shrink-0 px-4 py-3">
        <Text variant="bodySmall" weight="medium" className="text-default-500" as="h2">
          Chats
        </Text>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-2">{sessionContent}</div>
    </section>
  );
}
