import type { RootState } from '@/store/store';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
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

export interface CreateItemRequest {
  name: string;
  sku: string;
  description?: string;
  mainUnit: string;
  buyingUnit: string;
  transferUnit: string;
  usingUnit: string;
  buyingToMainRate?: number;
  transferToMainRate?: number;
  usingToMainRate?: number;
  safetyStockLevel?: number;
  reorderLevel?: number;
  isActive?: boolean;
}

export interface UpdateItemRequest {
  name?: string;
  sku?: string;
  description?: string;
  mainUnit?: string;
  buyingUnit?: string;
  transferUnit?: string;
  usingUnit?: string;
  buyingToMainRate?: number;
  transferToMainRate?: number;
  usingToMainRate?: number;
  safetyStockLevel?: number;
  reorderLevel?: number;
  isActive?: boolean;
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

    // Create new item
    createItem: builder.mutation<Item, CreateItemRequest>({
      query: (itemData) => ({
        url: '',
        method: 'POST',
        body: itemData,
      }),
      invalidatesTags: [TAG_TYPES.ITEM],
    }),

    // Update existing item
    updateItem: builder.mutation<Item, { id: string; data: UpdateItemRequest }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [TAG_TYPES.ITEM, { type: TAG_TYPES.ITEM, id }],
    }),

    // Delete item (soft delete)
    deleteItem: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [TAG_TYPES.ITEM, { type: TAG_TYPES.ITEM, id }],
    }),

    // Hard delete item (permanent)
    hardDeleteItem: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/${id}/hard`,
        method: 'DELETE',
      }),
      invalidatesTags: [TAG_TYPES.ITEM],
    }),
  }),
});

export const {
  useGetItemsQuery,
  useSearchItemsQuery,
  useGetItemsByBranchQuery,
  useGetItemQuery,
  useGetAllItemsQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
  useHardDeleteItemMutation,
} = itemApi;
