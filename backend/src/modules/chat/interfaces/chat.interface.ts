export interface ChatSession {
  id: string;
  title: string;
  description?: string;
  userId: string;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  content: string;
  type: 'user' | 'assistant' | 'system' | 'error';
  contentType: 'text' | 'data' | 'chart' | 'table';
  metadata?: Record<string, unknown>;
  parentMessageId?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueryContext {
  userId: string;
  sessionHistory: ChatMessage[];
  availableTables: string[];
  userPermissions: string[];
}

export interface DatabaseQueryResult {
  success: boolean;
  data?: unknown;
  query?: string;
  error?: string;
  metadata?: {
    executionTime: number;
    rowCount: number;
    queryType: 'SELECT' | 'COUNT' | 'AGGREGATE' | 'COMPLEX';
  };
}

export interface AIChatResponse {
  message: string;
  type: 'text' | 'data' | 'error';
  sessionId?: string;
  timestamp?: string;
  data?: unknown;
  suggestions?: string[];
  needsUserInput?: boolean;
  metadata?: Record<string, unknown>;
  sqlQuery?: string; // Generated SQL query for debugging
  databaseQuery?: string; // Alternative field name for query info
}

export interface SocketUser {
  id: string;
  email: string;
  role: string;
  branchId?: string;
}
