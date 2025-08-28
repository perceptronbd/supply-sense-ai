import { ApiResponse, transformApiResponse } from '@/lib/utils/api-response';
import type { RootState } from '@/store/store';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { config } from '../../config/env';
import { TAG_TYPES } from './tagTypes';

// Chat interfaces
export interface ChatSession {
  id: string;
  title: string;
  description?: string;
  userId: string;
  dbConnectionId: string;
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
  dbConnectionId: string;
}

export interface ChatQueryRequest {
  sessionId: string;
  query: string;
  dbConnectionId: string;
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
    baseUrl: config.getApiUrl('/api/chat'),
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [TAG_TYPES.CHAT_SESSION, TAG_TYPES.CHAT_MESSAGE, TAG_TYPES.DATABASE_CONNECTION],
  endpoints: (builder) => ({
    // Health check - temporarily disable transform to test
    getHealth: builder.query<
      ApiResponse<{ status: string; timestamp: string; services: Record<string, string> }>,
      void
    >({
      query: () => '/health',
      // Temporarily removed transformResponse for testing
    }),

    // Session management
    createSession: builder.mutation<ChatSession, CreateSessionRequest>({
      query: (sessionData) => ({
        url: '/sessions',
        method: 'POST',
        body: sessionData,
      }),
      transformResponse: (response: ApiResponse<ChatSession>) => transformApiResponse(response),
      invalidatesTags: [TAG_TYPES.CHAT_SESSION],
    }),

    getSessions: builder.query<ChatSession[], { limit?: number; offset?: number }>({
      query: ({ limit = 20, offset = 0 } = {}) => ({
        url: '/sessions',
        params: { limit, offset },
      }),
      transformResponse: (response: ApiResponse<ChatSession[]>) => transformApiResponse(response),
      providesTags: [TAG_TYPES.CHAT_SESSION],
    }),

    getSession: builder.query<ChatSession, string>({
      query: (sessionId) => `/sessions/${sessionId}`,
      transformResponse: (response: ApiResponse<ChatSession>) => transformApiResponse(response),
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
      transformResponse: (response: ApiResponse<ChatMessage[]>) => transformApiResponse(response),
      providesTags: (_result, _error, { sessionId }) => [
        { type: TAG_TYPES.CHAT_MESSAGE, id: sessionId },
      ],
    }),

    // Chat query with database connection support
    sendQuery: builder.mutation<ChatQueryResponse, ChatQueryRequest>({
      query: (queryData) => ({
        url: '/query',
        method: 'POST',
        body: queryData,
      }),
      // Chat endpoint bypasses ResponseInterceptor, so we handle raw response
      transformResponse: (response: ChatQueryResponse) => response,
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
