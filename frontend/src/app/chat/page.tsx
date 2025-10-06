'use client';
import { useCallback, useMemo } from 'react';
import { ChatInterface, SessionManager } from '@/components/chat';
import { LoadingOverlay } from '@/components/ui/Loading';
import { Text } from '@/components/ui/Text';
import { useDatabaseConnections } from '@/hooks/useDatabaseConnections';
import { useSessionManager } from '@/hooks/useSessionManager';

export default function ChatPage() {
  // Database connection management
  const { databaseConnections, selectedDbConnectionId, isLoadingConnections, connectionsError } =
    useDatabaseConnections();

  // Session management
  const { activeSessionId, isCreatingSession, createNewSession, selectSession } =
    useSessionManager(selectedDbConnectionId);

  // Memoized handlers to prevent unnecessary re-renders
  const handleCreateSession = useCallback(async () => {
    if (activeSessionId) return activeSessionId;
    return await createNewSession();
  }, [activeSessionId, createNewSession]);

  const handleSessionSelect = useCallback(
    (sessionId: string) => {
      selectSession(sessionId);
    },
    [selectSession]
  );

  const handleSessionCreate = useCallback(
    (sessionId: string) => {
      selectSession(sessionId);
    },
    [selectSession]
  );

  // Memoized error and loading states for better performance
  const errorState = useMemo(() => {
    if (connectionsError) {
      return (
        <div className="flex flex-1 justify-center items-center p-8">
          <div className="max-w-4xl text-center">
            <Text variant="titleLarge" color="danger" className="mb-4" as="h1">
              Database Connection Error
            </Text>
            <Text variant="bodyLarge" color="muted" as="p">
              Failed to load database connections. Please check your setup or contact support.
            </Text>
          </div>
        </div>
      );
    }

    if (databaseConnections?.length === 0) {
      return (
        <div className="flex flex-1 justify-center items-center p-8">
          <div className="max-w-4xl text-center">
            <Text variant="titleLarge" color="default" className="mb-4" as="h1">
              No Database Connections
            </Text>
            <Text variant="bodyLarge" color="muted" as="p">
              Please set up a database connection in the onboarding section before using the chat.
            </Text>
          </div>
        </div>
      );
    }

    return null;
  }, [connectionsError, databaseConnections]);

  // Show loading state while connections are being fetched
  if (isLoadingConnections) {
    return (
      <main className="w-full h-[calc(100vh-40px)]">
        <div className="flex overflow-hidden relative h-full text-foreground">
          <LoadingOverlay
            isVisible={true}
            message="Loading database connections..."
            opacity="light"
          />
        </div>
      </main>
    );
  }

  // Show error states
  if (errorState) {
    return (
      <main className="w-full h-[calc(100vh-40px)] grid place-items-center">{errorState}</main>
    );
  }

  // Main chat interface - only render when we have a database connection
  return (
    <main className="w-full h-full bg-background lg:flex gap-2">
      <div className="relative h-full text-foreground rounded-2xl bg-content2 flex-1 w-full">
        {/* Loading overlay during session creation */}
        <LoadingOverlay
          isVisible={isCreatingSession}
          message="Initializing chat session..."
          opacity="light"
        />

        {/* Main chat interface container */}
        <section className="flex flex-1 w-full h-full">
          <ChatInterface
            sessionId={activeSessionId}
            dbConnectionId={selectedDbConnectionId}
            handleCreateSession={handleCreateSession}
          />
        </section>
      </div>

      {/* Session Manager Sidebar - only show when database connection is available */}
      {selectedDbConnectionId && (
        <SessionManager
          selectedSessionId={activeSessionId}
          dbConnectionId={selectedDbConnectionId}
          onSessionSelect={handleSessionSelect}
          onSessionCreate={handleSessionCreate}
        />
      )}
    </main>
  );
}
