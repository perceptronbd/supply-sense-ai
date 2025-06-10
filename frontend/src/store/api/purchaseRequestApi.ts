import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { TAG_TYPES, TAG_TYPE_GROUPS } from './tagTypes';

// API Response Types
export interface PurchaseRequestItem {
  id: string;
  itemId: string;
  requestedQty: number;
  estimatedPrice: number | null;
  totalAmount: number;
  requiredDate: string;
  remarks?: string;
  item: {
    id: string;
    name: string;
    code: string;
    description?: string;
    unit: string;
  };
}

export interface PurchaseRequest {
  id: string;
  prNumber: string;
  title?: string;
  description?: string;
  requiredDate: string;
  branchId: string;
  createdById: string;
  prTemplateId?: string;
  justification?: string;
  totalAmount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CONVERTED_TO_PO';
  createdAt: string;
  updatedAt: string;
  items: PurchaseRequestItem[];
  branch: {
    id: string;
    name: string;
    code: string;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  prTemplate?: {
    id: string;
    name: string;
  };
}

// API Request Types
export interface CreatePurchaseRequestRequest {
  title?: string;
  description?: string;
  requiredDate: string;
  branchId: string;
  prTemplateId?: string;
  justification?: string;
  items: {
    itemId: string;
    requestedQty: number;
    estimatedPrice?: number;
    requiredDate: string;
    remarks?: string;
  }[];
}

export interface UpdatePurchaseRequestRequest extends Partial<CreatePurchaseRequestRequest> {}

export interface Branch {
  id: string;
  name: string;
  code: string;
}

export interface Item {
  id: string;
  name: string;
  code: string;
  description?: string;
  unit: string;
  currentPrice?: number;
}

export interface PurchaseRequestTemplate {
  id: string;
  name: string;
  description?: string;
  items: {
    itemId: string;
    defaultQty: number;
    item: Item;
  }[];
}

export const purchaseRequestApi = createApi({
  reducerPath: 'purchaseRequestApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3000/api/purchase-request',
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
    },
  }),
  tagTypes: TAG_TYPE_GROUPS.PURCHASE_REQUEST_MODULE,
  endpoints: (builder) => ({
    // Purchase Request endpoints
    createPurchaseRequest: builder.mutation<PurchaseRequest, CreatePurchaseRequestRequest>({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [TAG_TYPES.PURCHASE_REQUEST],
    }),
    getPurchaseRequests: builder.query<PurchaseRequest[], { branchId?: string }>({
      query: ({ branchId } = {}) => ({
        url: '',
        params: branchId ? { branchId } : {},
      }),
      providesTags: [TAG_TYPES.PURCHASE_REQUEST],
    }),
    getPurchaseRequest: builder.query<PurchaseRequest, string>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: TAG_TYPES.PURCHASE_REQUEST, id }],
    }),

    updatePurchaseRequest: builder.mutation<
      PurchaseRequest,
      { id: string; data: UpdatePurchaseRequestRequest }
    >({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: TAG_TYPES.PURCHASE_REQUEST, id }],
    }),

    deletePurchaseRequest: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [TAG_TYPES.PURCHASE_REQUEST],
    }),
    submitPurchaseRequest: builder.mutation<PurchaseRequest, string>({
      query: (id) => ({
        url: `/${id}/submit`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: TAG_TYPES.PURCHASE_REQUEST, id }],
    }),
    approvePurchaseRequest: builder.mutation<PurchaseRequest, string>({
      query: (id) => ({
        url: `/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: TAG_TYPES.PURCHASE_REQUEST, id }],
    }),

    rejectPurchaseRequest: builder.mutation<PurchaseRequest, string>({
      query: (id) => ({
        url: `/${id}/reject`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: TAG_TYPES.PURCHASE_REQUEST, id }],
    }),

    getPurchaseRequestTemplates: builder.query<PurchaseRequestTemplate[], { branchId?: string }>({
      query: ({ branchId } = {}) => ({
        url: '/templates', // This might need to be adjusted based on your backend
        params: branchId ? { branchId } : {},
      }),
      providesTags: [TAG_TYPES.PURCHASE_REQUEST_TEMPLATE],
    }),
  }),
});

export const {
  useCreatePurchaseRequestMutation,
  useGetPurchaseRequestsQuery,
  useGetPurchaseRequestQuery,
  useUpdatePurchaseRequestMutation,
  useDeletePurchaseRequestMutation,
  useSubmitPurchaseRequestMutation,
  useApprovePurchaseRequestMutation,
  useRejectPurchaseRequestMutation,
  useGetPurchaseRequestTemplatesQuery,
} = purchaseRequestApi;
