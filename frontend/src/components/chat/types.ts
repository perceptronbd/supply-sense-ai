export type { ChatMessage, ChatSession } from '@/store/api/chatApi';

import type { ChatMessageResponse } from '@/store/api/chatApi';

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isStreaming?: boolean;
  disabled?: boolean;
  message: string;
  setMessage: (message: string) => void;
}

export interface MessageListProps {
  messages: ChatMessageResponse[];
  isLoading?: boolean;
  isStreaming?: boolean;
  isError?: boolean;
  onSuggestionClick?: (suggestion: string) => void;
}

export interface ChatInterfaceProps {
  dbConnectionId?: string;
  className?: string;
  handleCreateSession: () => Promise<string | undefined>;
}

export interface SampleQuestionsProps {
  dbConnectionId: string;
  className?: string;
  onQuestionClick?: (question: string) => void;
}
