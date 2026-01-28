import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ApiResponse, transformApiResponse } from '@/lib/utils/api-response';
import type { RootState } from '@/store/store';
import { config } from '../../config/env';
import { TAG_TYPES } from './tagTypes';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  companyName: string;
  companyEmail: string;
  industry: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  taxId?: string;
  businessAddress?: string;
  contactPhone?: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    permissions: string[];
    branchId: string;
    isActive: boolean;
    companyId: string;
  };
  access_token: string;
  refresh_token: string;
}

interface RegistrationResponse {
  success: boolean;
  message: string;
  company: {
    id: string;
    name: string;
    contactEmail: string;
    industry: string;
  };
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isSuperAdmin: boolean;
  };
  access_token: string;
  refresh_token: string;
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
  tagTypes: [TAG_TYPES.AUTH, TAG_TYPES.USER_PROFILE],
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
    register: builder.mutation<RegistrationResponse, RegisterRequest>({
      query: (registerData) => ({
        url: '/register',
        method: 'POST',
        body: registerData,
      }),
      transformResponse: (response: ApiResponse<RegistrationResponse>) =>
        transformApiResponse(response),
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
    refresh: builder.mutation<LoginResponse, string>({
      query: (refreshToken) => ({
        url: '/refresh',
        method: 'POST',
        body: { refresh_token: refreshToken },
      }),
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useGetProfileQuery, useRefreshMutation } =
  authApi;
