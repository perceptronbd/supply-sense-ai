import { ApiResponse, transformApiResponse } from '@/lib/utils/api-response';
import type { RootState } from '@/store/store';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { config } from '../../config/env';
import { TAG_TYPES } from './tagTypes';

// API Response Types
export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  averageLeadTime?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  code: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  averageLeadTime?: number;
  isActive?: boolean;
}

export interface UpdateSupplierRequest {
  name?: string;
  code?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  averageLeadTime?: number;
  isActive?: boolean;
}

export interface GetSuppliersRequest {
  search?: string;
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}

export interface SuppliersResponse {
  data: Supplier[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const supplierApi = createApi({
  reducerPath: 'supplierApi',
  baseQuery: fetchBaseQuery({
    baseUrl: config.getApiUrl('/api/suppliers'),
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [TAG_TYPES.SUPPLIER],
  endpoints: (builder) => ({
    // Get all suppliers with optional pagination and search
    getSuppliers: builder.query<SuppliersResponse, GetSuppliersRequest | undefined>({
      query: (params = {}) => {
        const { search, page, limit, includeInactive } = params;
        const urlParams = new URLSearchParams();

        if (search) urlParams.append('search', search);
        if (page) urlParams.append('page', page.toString());
        if (limit) urlParams.append('limit', limit.toString());
        if (includeInactive) urlParams.append('includeInactive', includeInactive.toString());

        const queryString = urlParams.toString();
        return {
          url: queryString ? `?${queryString}` : '',
        };
      },
      providesTags: [TAG_TYPES.SUPPLIER],
      transformResponse: (response: ApiResponse<Supplier[] | SuppliersResponse>) => {
        const transformed = transformApiResponse(response);

        // Handle both array response (no pagination) and paginated response
        if (Array.isArray(transformed)) {
          return { data: transformed, pagination: undefined };
        }
        return transformed as SuppliersResponse;
      },
    }),

    // Get specific supplier by ID
    getSupplier: builder.query<Supplier, string>({
      query: (id) => `/${id}`,
      transformResponse: (response: ApiResponse<Supplier>) => transformApiResponse(response),
      providesTags: (_result, _error, id) => [{ type: TAG_TYPES.SUPPLIER, id }],
    }),

    // Create new supplier
    createSupplier: builder.mutation<Supplier, CreateSupplierRequest>({
      query: (supplierData) => ({
        url: '',
        method: 'POST',
        body: supplierData,
      }),
      transformResponse: (response: ApiResponse<Supplier>) => transformApiResponse(response),
      invalidatesTags: [TAG_TYPES.SUPPLIER],
    }),

    // Update existing supplier
    updateSupplier: builder.mutation<Supplier, { id: string; supplierData: UpdateSupplierRequest }>(
      {
        query: ({ id, supplierData }) => ({
          url: `/${id}`,
          method: 'PUT',
          body: supplierData,
        }),
        transformResponse: (response: ApiResponse<Supplier>) => transformApiResponse(response),
        invalidatesTags: (_result, _error, { id }) => [
          TAG_TYPES.SUPPLIER,
          { type: TAG_TYPES.SUPPLIER, id },
        ],
      }
    ),

    // Soft delete supplier
    deleteSupplier: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        TAG_TYPES.SUPPLIER,
        { type: TAG_TYPES.SUPPLIER, id },
      ],
    }),

    // Hard delete supplier
    hardDeleteSupplier: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}/hard`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        TAG_TYPES.SUPPLIER,
        { type: TAG_TYPES.SUPPLIER, id },
      ],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useHardDeleteSupplierMutation,
} = supplierApi;
