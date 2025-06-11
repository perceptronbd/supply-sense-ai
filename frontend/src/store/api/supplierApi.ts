import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
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

export const supplierApi = createApi({
  reducerPath: 'supplierApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3000/api/suppliers',
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
    }),

    // Get specific supplier by ID
    getSupplier: builder.query<Supplier, string>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: TAG_TYPES.SUPPLIER, id }],
    }),
  }),
});

export const { useGetSuppliersQuery, useGetSupplierQuery } = supplierApi;
