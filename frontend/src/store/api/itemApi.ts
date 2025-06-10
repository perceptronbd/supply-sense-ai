import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { TAG_TYPES } from './tagTypes';

// API Response Types
export interface Item {
  id: string;
  name: string;
  sku: string;
  description?: string;
  mainUnit: string;
  buyingUnit?: string;
  transferUnit?: string;
  usingUnit?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stock?: {
    quantity: number;
    availableQty: number;
    reservedQty?: number;
  };
}

// API Request Types
export interface ItemQueryParams {
  search?: string;
  branchId?: string;
  page?: number;
  limit?: number;
  includeInactive?: boolean;
  includeStock?: boolean;
}

export interface ItemSearchParams {
  q: string;
  branchId?: string;
  limit?: number;
}

export interface ItemsResponse {
  data: Item[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const itemApi = createApi({
  reducerPath: 'itemApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3000/api/items',
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
    },
  }),
  tagTypes: [TAG_TYPES.ITEM],
  endpoints: (builder) => ({
    // Get all items with optional pagination and search
    getItems: builder.query<ItemsResponse, ItemQueryParams | undefined>({
      query: (params = {}) => ({
        url: '',
        params: params || {},
      }),
      providesTags: [TAG_TYPES.ITEM],
    }),

    // Search items for dropdowns and selection
    searchItems: builder.query<Item[], ItemSearchParams>({
      query: (params) => ({
        url: '/search',
        params,
      }),
      providesTags: [TAG_TYPES.ITEM],
    }),

    // Get items by branch with stock information
    getItemsByBranch: builder.query<
      ItemsResponse,
      { branchId: string } & Omit<ItemQueryParams, 'branchId'>
    >({
      query: ({ branchId, ...params }) => ({
        url: `/by-branch/${branchId}`,
        params,
      }),
      providesTags: [TAG_TYPES.ITEM],
    }),

    // Get specific item by ID
    getItem: builder.query<Item, { id: string; branchId?: string; includeStock?: boolean }>({
      query: ({ id, branchId, includeStock }) => ({
        url: `/${id}`,
        params: { branchId, includeStock },
      }),
      providesTags: (_result, _error, { id }) => [{ type: TAG_TYPES.ITEM, id }],
    }),

    // Get all items (simplified for dropdowns)
    getAllItems: builder.query<Item[], { branchId?: string }>({
      query: ({ branchId } = {}) => ({
        url: '',
        params: branchId ? { branchId } : {},
      }),
      transformResponse: (response: ItemsResponse) => response.data,
      providesTags: [TAG_TYPES.ITEM],
    }),
  }),
});

export const {
  useGetItemsQuery,
  useSearchItemsQuery,
  useGetItemsByBranchQuery,
  useGetItemQuery,
  useGetAllItemsQuery,
} = itemApi;
