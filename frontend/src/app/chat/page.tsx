'use client';

import { ChatInterface } from '@/components/chat';
import { LoadingOverlay } from '@/components/ui/Loading';
import { Text } from '@/components/ui/Text';
import { useGetCompanyId } from '@/hooks/useGetCompanyId';
import { useCreateSessionMutation } from '@/store/api/chatApi';
import { useGetDatabaseConnectionsQuery } from '@/store/api/dbConnectionApi';
import { useEffect, useState } from 'react';

export default function ChatPage() {
  // State management for active chat session
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(
    'cmft8f5ek00011630zzmqz8xh'
  );
  console.log('🚀 > ChatPage > activeSessionId:', activeSessionId);
  const [selectedDbConnectionId, setSelectedDbConnectionId] = useState<string | undefined>();
  console.log('🚀 > ChatPage > selectedDbConnectionId:', selectedDbConnectionId);

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
  useEffect(() => {
    // Function to initialize a new chat session
    const initializeSession = async () => {
      if (!selectedDbConnectionId) {
        console.log('No database connection selected yet');
        return;
      }

      try {
        // Create session with timestamp-based title and selected database connection
        const sessionTitle = `Chat ${new Date().toLocaleString()}`;
        console.log('🚀 > initializeSession > sessionTitle:', sessionTitle);

        // const newSession = await createSession({
        //   title: sessionTitle,
        //   description: 'New chat session for supply chain analytics',
        //   dbConnectionId: selectedDbConnectionId,
        // }).unwrap();

        // // Set the active session ID for the chat interface
        // setActiveSessionId(newSession.id);

        // console.log('Chat session initialized:', newSession.id);
      } catch (error) {
        console.error('Failed to initialize chat session:', error);

        // Reset session ID on error to show error state
        setActiveSessionId(undefined);
      }
    };

    // Only initialize if no active session exists and db connection is selected
    if (!activeSessionId && selectedDbConnectionId && !isCreatingSession) {
      initializeSession();
    }
  }, [activeSessionId, selectedDbConnectionId, createSession, isCreatingSession]);

  // // Handle session selection from SessionManager
  // const handleSessionSelect = (sessionId: string) => {
  //   setActiveSessionId(sessionId);
  // };

  // // Handle new session creation from SessionManager
  // const handleSessionCreate = (sessionId: string) => {
  //   setActiveSessionId(sessionId);
  // };

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
      <main className="w-full h-[calc(100vh-40px)] ">
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
    <main className="w-full h-full ">
      <div className=" relative h-full  text-foreground">
        {/* Loading overlay during session creation */}
        <LoadingOverlay
          isVisible={isCreatingSession}
          message="Initializing chat session..."
          opacity="light"
        />

        {/* Main chat interface container with session manager */}
        <section className="flex flex-1 w-full h-full">
          {/* Session Manager Sidebar */}
          {/* <div className="flex-shrink-0">
            {selectedDbConnectionId && (
              <SessionManager
                selectedSessionId={activeSessionId}
                dbConnectionId={selectedDbConnectionId}
                onSessionSelect={handleSessionSelect}
                onSessionCreate={handleSessionCreate}
              />
            )}
          </div> */}

          {/* Chat Interface */}
          {activeSessionId && selectedDbConnectionId ? (
            <ChatInterface sessionId={activeSessionId} dbConnectionId={selectedDbConnectionId} />
          ) : (
            /* Loading state while session is being created */
            <article
              className="flex flex-1 justify-center items-center p-8"
              aria-label="Loading section"
            >
              <header className="max-w-4xl text-center">
                <Text variant="titleLarge" color="default" weight="bold" className="mb-4" as="h1">
                  Initializing SupplySense AI
                </Text>

                <Text variant="bodyLarge" color="muted" as="p">
                  Setting up your chat session with database connection...
                </Text>
              </header>
            </article>
          )}
        </section>
      </div>
    </main>
  );
}
