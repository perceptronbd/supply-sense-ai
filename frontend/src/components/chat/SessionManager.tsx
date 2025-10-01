'use client';

import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { useCreateSessionMutation, useGetSessionsQuery } from '@/store/api/chatApi';
import { Fragment } from 'react';
import { SessionList } from './SessionList';

interface SessionManagerProps {
  selectedSessionId?: string;
  dbConnectionId: string;
  onSessionSelect: (sessionId: string) => void;
  onSessionCreate: (sessionId: string) => void;
}

export function SessionManager({
  selectedSessionId,
  dbConnectionId,
  onSessionSelect,
  onSessionCreate,
}: SessionManagerProps) {
  // Fetch sessions
  const {
    data: sessions = [],
    isLoading: isLoadingSessions,
    error: sessionsError,
    refetch: refetchSessions,
  } = useGetSessionsQuery({});

  // Create session mutation
  const [createSession, { isLoading: isCreatingSession }] = useCreateSessionMutation();

  // Handle session refresh when triggered by Redux state
  useSessionRefresh(refetchSessions);

  // Handle new session creation
  const handleNewSession = async () => {
    try {
      const sessionTitle = `Chat ${new Date().toLocaleString()}`;

      const newSession = await createSession({
        title: sessionTitle,
        description: 'New chat session for supply chain analytics',
        dbConnectionId,
      }).unwrap();

      // Notify parent component about the new session
      onSessionCreate(newSession.id);
    } catch (error) {
      console.error('Failed to create new session:', error);
    }
  };

  // Show error state if sessions failed to load
  if (sessionsError) {
    return (
      <aside className="w-64 border-r border-divider bg-content1 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-danger text-sm">Failed to load sessions</p>
        </div>
      </aside>
    );
  }

  return (
    <Fragment>
      <div className="hidden md:block overflow-y-auto no-scrollbar bottom-fade">
        <SessionList
          sessions={sessions}
          activeSessionId={selectedSessionId}
          onSessionSelect={onSessionSelect}
          onNewSession={handleNewSession}
          isLoading={isLoadingSessions || isCreatingSession}
        />
      </div>
      {/* <div className="md:hidden overflow-y-auto no-scrollbar bottom-fade">
        <SessionListMobile
          sessions={sessions}
          activeSessionId={selectedSessionId}
          onSessionSelect={onSessionSelect}
          onNewSession={handleNewSession}
          isLoading={isLoadingSessions || isCreatingSession}
        />
      </div> */}
    </Fragment>
  );
}
