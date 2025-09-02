import type { Message } from '@prisma/client';

export interface QueryContext {
  userId: string;
  sessionHistory: Message[];
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
  type: 'data' | 'error';
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
