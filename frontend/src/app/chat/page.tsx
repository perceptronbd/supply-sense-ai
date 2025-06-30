'use client';

import { ChatInterface } from '@/components/chat';
import { LoadingOverlay } from '@/components/ui/Loading';
import { Text } from '@/components/ui/Text';
import { useCreateSessionMutation } from '@/store/api/chatApi';
import { useEffect, useState } from 'react';

export default function ChatPage() {
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>();
  const [createSession, { isLoading: isCreatingSession }] = useCreateSessionMutation();

  // Automatically create a session when the page loads
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const newSession = await createSession({
          title: `Chat ${new Date().toLocaleString()}`,
        }).unwrap();

        setActiveSessionId(newSession.id);
        console.log('Chat session initialized:', newSession.id);
      } catch (error) {
        console.error('Failed to initialize chat session:', error);
      }
    };

    if (!activeSessionId) {
      initializeSession();
    }
  }, [activeSessionId, createSession]);

  return (
    <main className="w-full h-[calc(100vh-40px)] bg-background">
      <div className="flex overflow-hidden relative h-full bg-background text-foreground">
        <LoadingOverlay
          isVisible={isCreatingSession}
          message="Initializing chat..."
          opacity="light"
        />

        {/* Full-width chat interface */}
        <section className="flex flex-col flex-1 bg-background">
          {activeSessionId ? (
            <ChatInterface sessionId={activeSessionId} />
          ) : (
            <article
              className="flex flex-1 justify-center items-center p-8"
              aria-label="Loading section"
            >
              <header className="max-w-4xl text-center">
                <Text variant="titleLarge" color="default" weight="bold" className="mb-4" as="h1">
                  Initializing SupplySense AI
                </Text>
                <Text variant="bodyLarge" color="muted" as="p">
                  Please wait while we set up your chat session...
                </Text>
              </header>
            </article>
          )}
        </section>
      </div>
    </main>
  );
}
