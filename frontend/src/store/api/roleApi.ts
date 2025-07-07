import { ApiResponse, transformApiResponse } from '@/lib/utils/api-response';
import type { RootState } from '@/store/store';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { config } from '../../config/env';
import { TAG_TYPES } from './tagTypes';

// API Response Types
export interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  permissions?: Permission[];
  userCount?: number;
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  permission: string;
  description?: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissionIds: string[];
  isActive?: boolean;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface AssignPermissionsRequest {
  permissionIds: string[];
  action: 'replace' | 'assign' | 'remove';
}

export interface PermissionsByModule {
  [module: string]: Permission[];
}

export const roleApi = createApi({
  reducerPath: 'roleApi',
  baseQuery: fetchBaseQuery({
    baseUrl: config.getApiUrl('/api/roles'),
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [TAG_TYPES.ROLE, TAG_TYPES.PERMISSION, TAG_TYPES.USER],
  endpoints: (builder) => ({
    // Get all roles for the company
    getRoles: builder.query<Role[], void>({
      query: () => '',
      transformResponse: (response: ApiResponse<Role[]>) => transformApiResponse(response),
      providesTags: [TAG_TYPES.ROLE],
    }),

    // Get specific role by ID
    getRole: builder.query<Role, string>({
      query: (id) => `/${id}`,
      transformResponse: (response: ApiResponse<Role>) => transformApiResponse(response),
      providesTags: (_result, _error, id) => [{ type: TAG_TYPES.ROLE, id }],
    }),

    // Get all permissions organized by module
    getPermissionsByModule: builder.query<PermissionsByModule, void>({
      query: () => '/permissions',
      transformResponse: (response: ApiResponse<PermissionsByModule>) =>
        transformApiResponse(response),
      providesTags: [TAG_TYPES.PERMISSION],
    }),

    // Get all permissions as flat list
    getAllPermissions: builder.query<Permission[], void>({
      query: () => '/permissions/all',
      transformResponse: (response: ApiResponse<Permission[]>) => transformApiResponse(response),
      providesTags: [TAG_TYPES.PERMISSION],
    }),

    // Create new role
    createRole: builder.mutation<Role, CreateRoleRequest>({
      query: (roleData) => ({
        url: '',
        method: 'POST',
        body: roleData,
      }),
      transformResponse: (response: ApiResponse<Role>) => transformApiResponse(response),
      invalidatesTags: [TAG_TYPES.ROLE, TAG_TYPES.USER],
    }),

    // Update existing role
    updateRole: builder.mutation<Role, { id: string; roleData: UpdateRoleRequest }>({
      query: ({ id, roleData }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: roleData,
      }),
      transformResponse: (response: ApiResponse<Role>) => transformApiResponse(response),
      invalidatesTags: (_result, _error, { id }) => [
        TAG_TYPES.ROLE,
        { type: TAG_TYPES.ROLE, id },
        TAG_TYPES.USER,
      ],
    }),

    // Assign permissions to role
    assignPermissions: builder.mutation<
      Role,
      { id: string; permissionsData: AssignPermissionsRequest }
    >({
      query: ({ id, permissionsData }) => ({
        url: `/${id}/permissions`,
        method: 'PUT',
        body: permissionsData,
      }),
      transformResponse: (response: ApiResponse<Role>) => transformApiResponse(response),
      invalidatesTags: (_result, _error, { id }) => [
        TAG_TYPES.ROLE,
        { type: TAG_TYPES.ROLE, id },
        TAG_TYPES.USER,
      ],
    }),

    // Deactivate role (soft delete)
    deleteRole: builder.mutation<Role, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiResponse<Role>) => transformApiResponse(response),
      invalidatesTags: (_result, _error, id) => [
        TAG_TYPES.ROLE,
        { type: TAG_TYPES.ROLE, id },
        TAG_TYPES.USER,
      ],
    }),

    // Activate role
    activateRole: builder.mutation<Role, string>({
      query: (id) => ({
        url: `/${id}/activate`,
        method: 'PUT',
      }),
      transformResponse: (response: ApiResponse<Role>) => transformApiResponse(response),
      invalidatesTags: (_result, _error, id) => [
        TAG_TYPES.ROLE,
        { type: TAG_TYPES.ROLE, id },
        TAG_TYPES.USER,
      ],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleQuery,
  useGetPermissionsByModuleQuery,
  useGetAllPermissionsQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useAssignPermissionsMutation,
  useDeleteRoleMutation,
  useActivateRoleMutation,
} = roleApi;
