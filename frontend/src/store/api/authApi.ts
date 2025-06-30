import { ApiResponse, transformApiResponse } from '@/lib/utils/api-response';
import type { RootState } from '@/store/store';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { config } from '../../config/env';
import { TAG_TYPES, TAG_TYPE_GROUPS } from './tagTypes';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    branchId: string;
    isActive: boolean;
  };
  access_token: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: config.getApiUrl('/api/auth'),
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: TAG_TYPE_GROUPS.AUTH_MODULE,
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: ApiResponse<LoginResponse>) => transformApiResponse(response),
      transformErrorResponse: (response: { status: number; data: unknown }) => {
        // The backend global error handler sends errors in ApiErrorResponseDto format
        if (response.data && typeof response.data === 'object') {
          return {
            status: response.status,
            data: response.data as {
              success: false;
              statusCode: number;
              message: string;
              error?: string;
              details?: Record<string, unknown> | string[];
              metadata: {
                timestamp: string;
                path: string;
                correlationId: string;
              };
            },
          };
        }
        return response;
      },
    }),
    register: builder.mutation<LoginResponse, LoginRequest & { name: string }>({
      query: (userData) => ({
        url: '/register',
        method: 'POST',
        body: userData,
      }),
      transformResponse: (response: ApiResponse<LoginResponse>) => transformApiResponse(response),
      transformErrorResponse: (response: { status: number; data: unknown }) => {
        // The backend global error handler sends errors in ApiErrorResponseDto format
        if (response.data && typeof response.data === 'object') {
          return {
            status: response.status,
            data: response.data as {
              success: false;
              statusCode: number;
              message: string;
              error?: string;
              details?: Record<string, unknown> | string[];
              metadata: {
                timestamp: string;
                path: string;
                correlationId: string;
              };
            },
          };
        }
        return response;
      },
    }),
    getProfile: builder.query<LoginResponse['user'], void>({
      query: () => '/profile',
      transformResponse: (response: ApiResponse<LoginResponse['user']>) =>
        transformApiResponse(response),
      providesTags: [TAG_TYPES.AUTH],
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useGetProfileQuery } = authApi;
