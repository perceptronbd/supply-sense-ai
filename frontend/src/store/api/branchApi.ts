import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { TAG_TYPES } from './tagTypes';

// API Response Types
export interface Branch {
  id: string;
  name: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// API Request Types
export interface BranchQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}

export interface BranchesResponse {
  data: Branch[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const branchApi = createApi({
  reducerPath: 'branchApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3000/api/branches',
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
    },
  }),
  tagTypes: [TAG_TYPES.BRANCH],
  endpoints: (builder) => ({
    // Get all branches with optional pagination and search
    getBranches: builder.query<BranchesResponse, BranchQueryParams | undefined>({
      query: (params = {}) => ({
        url: '',
        params: params || {},
      }),
      providesTags: [TAG_TYPES.BRANCH],
    }), // Get current user's branch
    getUserBranch: builder.query<BranchesResponse, undefined>({
      query: () => '/my-branch',
      providesTags: [TAG_TYPES.BRANCH],
    }),

    // Get specific branch by ID
    getBranch: builder.query<Branch, string>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: TAG_TYPES.BRANCH, id }],
    }), // Get all branches (simplified for dropdowns)
    getAllBranches: builder.query<Branch[], undefined>({
      query: () => '',
      transformResponse: (response: BranchesResponse) => response.data,
      providesTags: [TAG_TYPES.BRANCH],
    }),
  }),
});

export const {
  useGetBranchesQuery,
  useGetUserBranchQuery,
  useGetBranchQuery,
  useGetAllBranchesQuery,
} = branchApi;
