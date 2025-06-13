'use client';

import { useState } from 'react';
import { ChatInterface, SessionList } from '../../components/chat';
import { Button } from '../../components/ui/Button';
import { LoadingOverlay } from '../../components/ui/Loading';
import { Text } from '../../components/ui/Text';
import { useCreateSessionMutation, useGetSessionsQuery } from '../../store/api/chatApi';

export default function ChatPage() {
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(); // RTK Query hooks
  const { data: sessions = [], isLoading: isLoadingSessions } = useGetSessionsQuery({});

  const [createSession, { isLoading: isCreatingSession }] = useCreateSessionMutation();

  const handleSessionSelect = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };
  const handleNewSession = async () => {
    try {
      const newSession = await createSession({
        title: `Chat ${new Date().toLocaleString()}`,
      }).unwrap();

      setActiveSessionId(newSession.id);
      console.log('New chat session created:', newSession.id);
    } catch (error) {
      console.error('Failed to create session:', error);
      // TODO: Add proper error handling UI
    }
  };

  return (
    <main className="flex h-screen bg-background text-foreground relative">
      <LoadingOverlay
        isVisible={isCreatingSession}
        message="Creating new chat session..."
        opacity="light"
        size="md"
      />

      {/* Sessions sidebar */}
      <SessionList
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={handleSessionSelect}
        onNewSession={handleNewSession}
        isLoading={isLoadingSessions}
      />

      {/* Chat interface */}
      <section className="flex-1 flex flex-col bg-background">
        {activeSessionId ? (
          <ChatInterface sessionId={activeSessionId} />
        ) : (
          <article
            className="flex-1 flex items-center justify-center p-6"
            aria-label="Welcome section"
          >
            <header className="text-center max-w-md">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Text variant="titleLarge" as="span" role="img" aria-label="AI assistant">
                  🤖
                </Text>
              </div>
              <Text variant="titleLarge" color="default" weight="bold" className="mb-4" as="h1">
                Welcome to SupplySense AI
              </Text>
              <Text variant="bodyLarge" color="muted" className="mb-6" as="p">
                Get instant insights about your SupplySense data through natural language queries.
                Ask about inventory levels, supplier performance, costs, and more.
              </Text>
              <Button
                onPress={handleNewSession}
                isLoading={isCreatingSession}
                color="primary"
                size="lg"
                className="font-medium"
              >
                {isCreatingSession ? 'Creating...' : 'Start New Chat'}
              </Button>
            </header>
          </article>
        )}
      </section>
    </main>
  );
}
