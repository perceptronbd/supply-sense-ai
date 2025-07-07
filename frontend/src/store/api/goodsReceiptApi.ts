import { ApiResponse, transformApiResponse } from '@/lib/utils/api-response';
import type { RootState } from '@/store/store';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { config } from '../../config/env';
import { TAG_TYPES } from './tagTypes';

export interface GRItem {
  id: string;
  itemId: string;
  orderedQty: string; // API returns as string
  receivedQty: string; // API returns as string
  unitPrice: string | null; // API returns as string
  totalCost: string | null; // API returns as string
  qualityNotes: string | null;
  item: {
    id: string;
    name: string;
    code: string;
    unit: string;
  };
}

export interface GoodsReceipt {
  id: string;
  grNumber: string;
  poId: string | null;
  mrId: string | null;
  receiptDate: string;
  documentNumber: string | null;
  branchId: string;
  receivedById: string;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  postedAt: string | null;
  items: GRItem[];
  purchaseOrder?: {
    id: string;
    poNumber: string;
    supplier: {
      id: string;
      name: string;
    };
  } | null;
  materialRequisition?: {
    id: string;
    mrNumber: string;
  } | null;
  branch: {
    id: string;
    name: string;
  };
  receivedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateGRItemDto {
  itemId: string;
  orderedQty: number;
  receivedQty: number;
  unitPrice?: number;
  qualityNotes?: string;
}

export interface CreateGoodsReceiptDto {
  poId?: string;
  mrId?: string;
  receiptDate?: string;
  documentNumber?: string;
  branchId: string;
  remarks?: string;
  items: CreateGRItemDto[];
}

export interface UpdateGoodsReceiptDto {
  receiptDate?: string;
  documentNumber?: string;
  remarks?: string;
  items?: CreateGRItemDto[];
}

export const goodsReceiptApi = createApi({
  reducerPath: 'goodsReceiptApi',
  baseQuery: fetchBaseQuery({
    baseUrl: config.getApiUrl('/api/goods-receipt'),
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
    },
  }),
  tagTypes: [
    TAG_TYPES.GOODS_RECEIPT,
    TAG_TYPES.PURCHASE_ORDER,
    TAG_TYPES.ITEM,
    TAG_TYPES.STOCK,
    TAG_TYPES.BRANCH,
  ],
  endpoints: (builder) => ({
    getGoodsReceipts: builder.query<GoodsReceipt[], { branchId?: string }>({
      query: (params) => ({
        url: '',
        params,
      }),
      transformResponse: (response: ApiResponse<GoodsReceipt[]>) => transformApiResponse(response),
      providesTags: [TAG_TYPES.GOODS_RECEIPT],
    }),

    getGoodsReceiptById: builder.query<GoodsReceipt, string>({
      query: (id: string) => `/${id}`,
      transformResponse: (response: ApiResponse<GoodsReceipt>) => transformApiResponse(response),
      providesTags: (_result, _error, id: string) => [{ type: TAG_TYPES.GOODS_RECEIPT, id }],
    }),

    createGoodsReceipt: builder.mutation<GoodsReceipt, CreateGoodsReceiptDto>({
      query: (data: CreateGoodsReceiptDto) => ({
        url: '',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<GoodsReceipt>) => transformApiResponse(response),
      invalidatesTags: [TAG_TYPES.GOODS_RECEIPT],
    }),

    updateGoodsReceipt: builder.mutation<GoodsReceipt, { id: string; data: UpdateGoodsReceiptDto }>(
      {
        query: ({ id, data }: { id: string; data: UpdateGoodsReceiptDto }) => ({
          url: `/${id}`,
          method: 'PATCH',
          body: data,
        }),
        transformResponse: (response: ApiResponse<GoodsReceipt>) => transformApiResponse(response),
        invalidatesTags: (_result, _error, { id }: { id: string }) => [
          { type: TAG_TYPES.GOODS_RECEIPT, id },
          TAG_TYPES.GOODS_RECEIPT,
        ],
      }
    ),

    deleteGoodsReceipt: builder.mutation<void, string>({
      query: (id: string) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [TAG_TYPES.GOODS_RECEIPT],
    }),

    postGoodsReceipt: builder.mutation<GoodsReceipt, string>({
      query: (id: string) => ({
        url: `/${id}/post`,
        method: 'POST',
      }),
      transformResponse: (response: ApiResponse<GoodsReceipt>) => transformApiResponse(response),
      invalidatesTags: (_result, _error, id: string) => [
        { type: TAG_TYPES.GOODS_RECEIPT, id },
        TAG_TYPES.GOODS_RECEIPT,
      ],
    }),

    cancelGoodsReceipt: builder.mutation<GoodsReceipt, string>({
      query: (id: string) => ({
        url: `/${id}/cancel`,
        method: 'POST',
      }),
      transformResponse: (response: ApiResponse<GoodsReceipt>) => transformApiResponse(response),
      invalidatesTags: (_result, _error, id: string) => [
        { type: TAG_TYPES.GOODS_RECEIPT, id },
        TAG_TYPES.GOODS_RECEIPT,
      ],
    }),
    createGoodsReceiptFromPO: builder.mutation<GoodsReceipt, string>({
      query: (poId: string) => ({
        url: `/from-po/${poId}`,
        method: 'POST',
      }),
      transformResponse: (response: ApiResponse<GoodsReceipt>) => transformApiResponse(response),
      invalidatesTags: (_result, _error, poId: string) => [
        TAG_TYPES.GOODS_RECEIPT,
        { type: TAG_TYPES.PURCHASE_ORDER, id: poId },
        TAG_TYPES.PURCHASE_ORDER,
      ],
    }),
    createGoodsReceiptFromMR: builder.mutation<GoodsReceipt, string>({
      query: (mrId: string) => ({
        url: `/from-mr/${mrId}`,
        method: 'POST',
      }),
      transformResponse: (response: ApiResponse<GoodsReceipt>) => transformApiResponse(response),
      invalidatesTags: [
        TAG_TYPES.GOODS_RECEIPT,
        // Add material requisition cache invalidation when that API is implemented
        // { type: TAG_TYPES.MATERIAL_REQUISITION, id: mrId },
        // TAG_TYPES.MATERIAL_REQUISITION,
      ],
    }),
  }),
});

export const {
  useGetGoodsReceiptsQuery,
  useGetGoodsReceiptByIdQuery,
  useCreateGoodsReceiptMutation,
  useUpdateGoodsReceiptMutation,
  useDeleteGoodsReceiptMutation,
  usePostGoodsReceiptMutation,
  useCancelGoodsReceiptMutation,
  useCreateGoodsReceiptFromPOMutation,
  useCreateGoodsReceiptFromMRMutation,
} = goodsReceiptApi;
