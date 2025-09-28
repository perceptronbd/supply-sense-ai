'use client';
import { ChatInterface, SessionManager } from '@/components/chat';
import { LoadingOverlay } from '@/components/ui/Loading';
import { Text } from '@/components/ui/Text';
import { useGetCompanyId } from '@/hooks/useGetCompanyId';
import { useCreateSessionMutation } from '@/store/api/chatApi';
import { useGetDatabaseConnectionsQuery } from '@/store/api/dbConnectionApi';
import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

export default function ChatPage() {
  // State management for active chat session
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>();

  const [selectedDbConnectionId, setSelectedDbConnectionId] = useState<string | undefined>();
  // Get user's company ID for database connections
  const { companyId } = useGetCompanyId();

  // RTK Query hooks
  const [createSession, { isLoading: isCreatingSession }] = useCreateSessionMutation();

  const {
    data: databaseConnections,
    isLoading: isLoadingConnections,
    error: connectionsError,
  } = useGetDatabaseConnectionsQuery(companyId, {
    skip: !companyId,
  });

  // Auto-select first database connection when available
  useEffect(() => {
    if (databaseConnections && databaseConnections.length > 0 && !selectedDbConnectionId) {
      const firstConnection = databaseConnections[0];
      setSelectedDbConnectionId(firstConnection.id);
    }
  }, [databaseConnections, selectedDbConnectionId]);

  // Auto-create session when database connection is selected
  const handleCreateSession = useCallback(async () => {
    // Only initialize if no active session exists and db connection is selected
    if (activeSessionId || !selectedDbConnectionId || isCreatingSession) {
      return activeSessionId;
    }

    try {
      // Create session with timestamp-based title and selected database connection
      const sessionTitle = `Chat ${new Date().toLocaleString()}`;
      const newSession = await createSession({
        title: sessionTitle,
        description: 'New chat session for supply chain analytics',
        dbConnectionId: selectedDbConnectionId,
      }).unwrap();

      // Set the active session ID for the chat interface
      flushSync(() => {
        setActiveSessionId(newSession.id);
      });

      console.log('Chat session initialized:', newSession.id);
      return newSession.id;
    } catch (error) {
      console.error('Failed to initialize chat session:', error);

      // Reset session ID on error to show error state
      flushSync(() => {
        setActiveSessionId(undefined);
      });
      throw error;
    }
  }, [activeSessionId, selectedDbConnectionId, createSession, isCreatingSession]);

  // Handle session selection from SessionManager
  const handleSessionSelect = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  // Handle new session creation from SessionManager
  const handleSessionCreate = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  // Show loading state while connections are being fetched
  if (isLoadingConnections) {
    return (
      <main className="w-full h-[calc(100vh-40px)] ">
        <div className="flex overflow-hidden relative h-full  text-foreground">
          <LoadingOverlay
            isVisible={true}
            message="Loading database connections..."
            opacity="light"
          />
        </div>
      </main>
    );
  }

  // Show error state if connections failed to load
  if (connectionsError) {
    return (
      <main className="w-full h-[calc(100vh-40px)] grid place-items-center ">
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
      </main>
    );
  }

  // Show error state if no database connections are available
  if (databaseConnections && databaseConnections.length === 0) {
    return (
      <main className="w-full h-[calc(100vh-40px)] ">
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
      </main>
    );
  }

  return (
    <main className="w-full h-full bg-background flex gap-2">
      <div className=" relative h-full text-foreground rounded-2xl bg-content2 flex-1 w-full">
        {/* Loading overlay during session creation */}
        <LoadingOverlay
          isVisible={isCreatingSession}
          message="Initializing chat session..."
          opacity="light"
        />

        {/* Main chat interface container with session manager */}
        <section className="flex flex-1 w-full h-full">
          {/* Chat Interface */}

          <ChatInterface
            sessionId={activeSessionId}
            dbConnectionId={selectedDbConnectionId}
            handleCreateSession={handleCreateSession}
          />
        </section>
      </div>
      {/* Session Manager Sidebar */}
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
