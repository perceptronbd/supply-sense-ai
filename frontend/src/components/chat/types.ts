// Re-export types from the API
export type { ChatMessage, ChatSession } from '@/store/api/chatApi';

import type { ChatMessageResponse } from '@/store/api/chatApi';

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export interface MessageListProps {
  messages: ChatMessageResponse[];
  isLoading?: boolean;
  onSuggestionClick?: (suggestion: string) => void;
}

export interface ChatInterfaceProps {
  dbConnectionId?: string;
  className?: string;
  handleCreateSession: () => Promise<string | undefined>;
}
