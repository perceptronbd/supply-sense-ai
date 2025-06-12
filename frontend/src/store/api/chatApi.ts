import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { TAG_TYPES } from './tagTypes';

// Chat interfaces
export interface ChatSession {
  id: string;
  title: string;
  description?: string;
  userId: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionRequest {
  title: string;
  description?: string;
}

export interface ChatQueryRequest {
  sessionId: string;
  query: string;
  includeDatabaseQuery?: boolean;
  context?: Record<string, unknown>;
}

export interface ChatQueryResponse {
  sessionId: string;
  message: string;
  type: 'text' | 'data' | 'error';
  timestamp: string;
  data?: unknown;
  suggestions?: string[];
  metadata?: Record<string, unknown>;
  sqlQuery?: string;
  databaseQuery?: string;
}

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3000/api/chat',
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [TAG_TYPES.CHAT_SESSION, TAG_TYPES.CHAT_MESSAGE],
  endpoints: (builder) => ({
    // Health check
    getHealth: builder.query<
      { status: string; timestamp: string; services: Record<string, string> },
      void
    >({
      query: () => '/health',
    }),

    // Session management
    createSession: builder.mutation<ChatSession, CreateSessionRequest>({
      query: (sessionData) => ({
        url: '/sessions',
        method: 'POST',
        body: sessionData,
      }),
      invalidatesTags: [TAG_TYPES.CHAT_SESSION],
    }),

    getSessions: builder.query<ChatSession[], { limit?: number; offset?: number }>({
      query: ({ limit = 20, offset = 0 } = {}) => ({
        url: '/sessions',
        params: { limit, offset },
      }),
      providesTags: [TAG_TYPES.CHAT_SESSION],
    }),

    getSession: builder.query<ChatSession, string>({
      query: (sessionId) => `/sessions/${sessionId}`,
      providesTags: (_result, _error, sessionId) => [
        { type: TAG_TYPES.CHAT_SESSION, id: sessionId },
      ],
    }),

    deleteSession: builder.mutation<void, string>({
      query: (sessionId) => ({
        url: `/sessions/${sessionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [TAG_TYPES.CHAT_SESSION],
    }),

    // Message management
    getSessionMessages: builder.query<
      ChatMessage[],
      { sessionId: string; limit?: number; offset?: number }
    >({
      query: ({ sessionId, limit = 50, offset = 0 }) => ({
        url: `/sessions/${sessionId}/messages`,
        params: { limit, offset },
      }),
      providesTags: (_result, _error, { sessionId }) => [
        { type: TAG_TYPES.CHAT_MESSAGE, id: sessionId },
      ],
    }),

    // Chat query
    sendQuery: builder.mutation<ChatQueryResponse, ChatQueryRequest>({
      query: (queryData) => ({
        url: '/query',
        method: 'POST',
        body: queryData,
      }),
      invalidatesTags: (_result, _error, { sessionId }) => [
        { type: TAG_TYPES.CHAT_MESSAGE, id: sessionId },
      ],
    }),
  }),
});

export const {
  useGetHealthQuery,
  useCreateSessionMutation,
  useGetSessionsQuery,
  useGetSessionQuery,
  useDeleteSessionMutation,
  useGetSessionMessagesQuery,
  useSendQueryMutation,
} = chatApi;
