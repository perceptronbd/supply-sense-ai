'use client';

import { Button } from '@heroui/react';
import { useState } from 'react';
import { ChatInterface, SessionList } from '../../components/chat';
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
    <div className="flex h-screen bg-background">
      {/* Sessions sidebar */}
      <SessionList
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={handleSessionSelect}
        onNewSession={handleNewSession}
        isLoading={isLoadingSessions || isCreatingSession}
      />

      {/* Chat interface */}
      <main className="flex-1 flex flex-col">
        {activeSessionId ? (
          <ChatInterface sessionId={activeSessionId} />
        ) : (
          <section className="flex-1 flex items-center justify-center" aria-label="Welcome section">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl" role="img" aria-label="AI assistant">
                  🤖
                </span>
              </div>
              <Text variant="titleLarge" className="text-foreground mb-4" as="h1">
                Welcome to Supply Chain AI
              </Text>
              <Text variant="bodyLarge" className="text-default-600 mb-6" as="p">
                Get instant insights about your supply chain data through natural language queries.
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
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
