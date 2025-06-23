import {
  ApiResponse,
  PaginatedResponse,
  transformApiResponse,
  transformFlexibleResponse,
} from '@/lib/utils/api-response';
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
  buyingToMainRate?: number;
  transferToMainRate?: number;
  usingToMainRate?: number;
  safetyStockLevel?: number;
  reorderLevel?: number;
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
    pages: number;
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
    getItems: builder.query<
      { data: Item[]; pagination?: PaginatedResponse<Item>['metadata']['pagination'] },
      ItemQueryParams | undefined
    >({
      query: (params = {}) => ({
        url: '',
        params: params || {},
      }),
      transformResponse: (response: PaginatedResponse<Item> | ApiResponse<Item[]>) =>
        transformFlexibleResponse(response),
      providesTags: [TAG_TYPES.ITEM],
    }),

    // Search items for dropdowns and selection
    searchItems: builder.query<Item[], ItemSearchParams>({
      query: (params) => ({
        url: '/search',
        params,
      }),
      transformResponse: (response: ApiResponse<Item[]>) => {
        const transformed = transformApiResponse(response);
        return transformed;
      },
      providesTags: [TAG_TYPES.ITEM],
    }),

    // Get items by branch with stock information
    getItemsByBranch: builder.query<
      { data: Item[]; pagination?: PaginatedResponse<Item>['metadata']['pagination'] },
      { branchId: string } & Omit<ItemQueryParams, 'branchId'>
    >({
      query: ({ branchId, ...params }) => ({
        url: `/by-branch/${branchId}`,
        params,
      }),
      transformResponse: (response: PaginatedResponse<Item> | ApiResponse<Item[]>) =>
        transformFlexibleResponse(response),
      providesTags: [TAG_TYPES.ITEM],
    }),

    // Get specific item by ID
    getItem: builder.query<Item, { id: string; branchId?: string; includeStock?: boolean }>({
      query: ({ id, branchId, includeStock }) => ({
        url: `/${id}`,
        params: { branchId, includeStock },
      }),
      transformResponse: (response: ApiResponse<Item>) => transformApiResponse(response),
      providesTags: (_result, _error, { id }) => [{ type: TAG_TYPES.ITEM, id }],
    }),

    // Get all items (simplified for dropdowns)
    getAllItems: builder.query<Item[], { branchId?: string }>({
      query: ({ branchId } = {}) => ({
        url: '',
        params: branchId ? { branchId } : {},
      }),
      transformResponse: (response: ApiResponse<Item[]>) => {
        return transformApiResponse(response);
      },
      providesTags: [TAG_TYPES.ITEM],
    }),

    // Create new item
    createItem: builder.mutation<Item, CreateItemRequest>({
      query: (itemData) => ({
        url: '',
        method: 'POST',
        body: itemData,
      }),
      transformResponse: (response: ApiResponse<Item>) => transformApiResponse(response),
      invalidatesTags: [TAG_TYPES.ITEM],
    }),

    // Update existing item
    updateItem: builder.mutation<Item, { id: string; data: UpdateItemRequest }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Item>) => transformApiResponse(response),
      invalidatesTags: (_result, _error, { id }) => [TAG_TYPES.ITEM, { type: TAG_TYPES.ITEM, id }],
    }),

    // Delete item (soft delete)
    deleteItem: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiResponse<{ message: string }>) =>
        transformApiResponse(response),
      invalidatesTags: (_result, _error, id) => [TAG_TYPES.ITEM, { type: TAG_TYPES.ITEM, id }],
    }),

    // Hard delete item (permanent)
    hardDeleteItem: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/${id}/hard`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiResponse<{ message: string }>) =>
        transformApiResponse(response),
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
