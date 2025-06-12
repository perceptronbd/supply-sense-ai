// Re-export types from the API
export type { ChatMessage, ChatSession } from '../../store/api/chatApi';
import type { ChatMessage } from '../../store/api/chatApi';

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onSuggestionClick?: (suggestion: string) => void;
}

export interface ChatInterfaceProps {
  sessionId?: string;
  className?: string;
}
