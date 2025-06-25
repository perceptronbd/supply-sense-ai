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
  createdAt: string;
  updatedAt: string;
}

export interface SuppliersResponse {
  data: Supplier[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
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
    // Get all suppliers
    getSuppliers: builder.query<Supplier[], void>({
      query: () => ({
        url: '',
      }),
      providesTags: [TAG_TYPES.SUPPLIER],
      transformResponse: (response: ApiResponse<Supplier[]>) => {
        return transformApiResponse(response);
      },
    }),

    // Get specific supplier by ID
    getSupplier: builder.query<Supplier, string>({
      query: (id) => `/${id}`,
      transformResponse: (response: ApiResponse<Supplier>) => transformApiResponse(response),
      providesTags: (_result, _error, id) => [{ type: TAG_TYPES.SUPPLIER, id }],
    }),
  }),
});

export const { useGetSuppliersQuery, useGetSupplierQuery } = supplierApi;
