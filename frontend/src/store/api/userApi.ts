import { ApiResponse, transformApiResponse } from '@/lib/utils/api-response';
import type { RootState } from '@/store/store';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { config } from '../../config/env';
import { TAG_TYPES } from './tagTypes';

// API Response Types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  roles?: Role[];
  branches?: Branch[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  permissions?: Permission[];
  userCount?: number;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  permission: string;
  description?: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  roleIds: string[];
  branchIds: string[];
  isActive?: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  isActive?: boolean;
  password?: string;
}

export interface AssignRolesRequest {
  roleIds: string[];
  operation: 'replace' | 'add' | 'remove';
}

export interface AssignBranchesRequest {
  branchIds: string[];
  operation: 'replace' | 'add' | 'remove';
}

export interface GetUsersRequest {
  search?: string;
  roleId?: string;
  branchId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'firstName' | 'lastName' | 'email' | 'username' | 'createdAt' | 'lastLogin';
  sortOrder?: 'asc' | 'desc';
  includeRoles?: boolean;
  includeBranches?: boolean;
}

export interface UsersResponse {
  data: User[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Helper function to build query parameters
const buildUserQueryParams = (params: GetUsersRequest = {}) => {
  const {
    search,
    roleId,
    branchId,
    isActive,
    page,
    limit,
    sortBy,
    sortOrder,
    includeRoles,
    includeBranches,
  } = params;
  const urlParams = new URLSearchParams();

  if (search) urlParams.append('search', search);
  if (roleId) urlParams.append('roleId', roleId);
  if (branchId) urlParams.append('branchId', branchId);
  if (isActive !== undefined) urlParams.append('isActive', isActive.toString());
  if (page) urlParams.append('page', page.toString());
  if (limit) urlParams.append('limit', limit.toString());
  if (sortBy) urlParams.append('sortBy', sortBy);
  if (sortOrder) urlParams.append('sortOrder', sortOrder);
  if (includeRoles) urlParams.append('includeRoles', includeRoles.toString());
  if (includeBranches) urlParams.append('includeBranches', includeBranches.toString());

  return urlParams;
};

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
    baseUrl: config.getApiUrl('/api/users'),
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [TAG_TYPES.USER, TAG_TYPES.ROLE, TAG_TYPES.BRANCH],
  endpoints: (builder) => ({
    // Get all users with optional pagination and search
    getUsers: builder.query<UsersResponse, GetUsersRequest | undefined>({
      query: (params = {}) => {
        const urlParams = buildUserQueryParams(params);
        const queryString = urlParams.toString();
        return {
          url: queryString ? `?${queryString}` : '',
        };
      },
      providesTags: [TAG_TYPES.USER],
      transformResponse: (response: ApiResponse<User[] | UsersResponse>) => {
        const transformed = transformApiResponse(response);

        // Handle both array response (no pagination) and paginated response
        if (Array.isArray(transformed)) {
          return { data: transformed, pagination: undefined };
        }
        return transformed as UsersResponse;
      },
    }),

    // Get specific user by ID
    getUser: builder.query<User, string>({
      query: (id) => `/${id}`,
      transformResponse: (response: ApiResponse<User>) => transformApiResponse(response),
      providesTags: (_result, _error, id) => [{ type: TAG_TYPES.USER, id }],
    }),

    // Create new user
    createUser: builder.mutation<User, CreateUserRequest>({
      query: (userData) => ({
        url: '',
        method: 'POST',
        body: userData,
      }),
      transformResponse: (response: ApiResponse<User>) => transformApiResponse(response),
      invalidatesTags: [TAG_TYPES.USER],
    }),

    // Update existing user
    updateUser: builder.mutation<User, { id: string; userData: UpdateUserRequest }>({
      query: ({ id, userData }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: userData,
      }),
      transformResponse: (response: ApiResponse<User>) => transformApiResponse(response),
      invalidatesTags: (_result, _error, { id }) => [TAG_TYPES.USER, { type: TAG_TYPES.USER, id }],
    }),

    // Assign roles to user
    assignRoles: builder.mutation<User, { id: string; rolesData: AssignRolesRequest }>({
      query: ({ id, rolesData }) => ({
        url: `/${id}/roles`,
        method: 'PUT',
        body: rolesData,
      }),
      transformResponse: (response: ApiResponse<User>) => transformApiResponse(response),
      invalidatesTags: (_result, _error, { id }) => [TAG_TYPES.USER, { type: TAG_TYPES.USER, id }],
    }),

    // Assign branches to user
    assignBranches: builder.mutation<User, { id: string; branchesData: AssignBranchesRequest }>({
      query: ({ id, branchesData }) => ({
        url: `/${id}/branches`,
        method: 'PUT',
        body: branchesData,
      }),
      transformResponse: (response: ApiResponse<User>) => transformApiResponse(response),
      invalidatesTags: (_result, _error, { id }) => [TAG_TYPES.USER, { type: TAG_TYPES.USER, id }],
    }),

    // Deactivate user (soft delete)
    deleteUser: builder.mutation<User, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiResponse<User>) => transformApiResponse(response),
      invalidatesTags: (_result, _error, id) => [TAG_TYPES.USER, { type: TAG_TYPES.USER, id }],
    }),

    // Hard delete user (permanent removal)
    // TODO: Implement backend endpoint for hard delete at /${id}/hard-delete
    hardDeleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}/hard-delete`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [TAG_TYPES.USER, { type: TAG_TYPES.USER, id }],
    }),

    // Activate user
    activateUser: builder.mutation<User, string>({
      query: (id) => ({
        url: `/${id}/activate`,
        method: 'PUT',
      }),
      transformResponse: (response: ApiResponse<User>) => transformApiResponse(response),
      invalidatesTags: (_result, _error, id) => [TAG_TYPES.USER, { type: TAG_TYPES.USER, id }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useAssignRolesMutation,
  useAssignBranchesMutation,
  useDeleteUserMutation,
  useHardDeleteUserMutation,
  useActivateUserMutation,
} = userApi;
