import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { TAG_TYPES, TAG_TYPE_GROUPS } from './tagTypes';

// API Response Types
export interface PurchaseOrderItem {
  id: string;
  itemId: string;
  orderedQty: number;
  receivedQty: number;
  unitPrice: number;
  totalAmount: number;
  deliveryDate: string;
  remarks?: string;
  item: {
    id: string;
    name: string;
    code: string;
    description?: string;
    unit: string;
  };
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  title?: string;
  prId?: string;
  supplierId: string;
  status: 'DRAFT' | 'SENT_TO_SUPPLIER' | 'CONFIRMED' | 'CANCELLED' | 'CLOSED';
  orderDate: string;
  expectedDeliveryDate: string;
  confirmedDate?: string;
  sentToSupplierAt?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  closedAt?: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: PurchaseOrderItem[];
  supplier: {
    id: string;
    name: string;
    code: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
  };
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
  purchaseRequest?: {
    id: string;
    prNumber: string;
    title?: string;
  };
}

// API Request Types
export interface CreatePurchaseOrderRequest {
  title?: string;
  prId?: string;
  supplierId: string;
  expectedDeliveryDate: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  branchId: string;
  notes?: string;
  items: {
    itemId: string;
    orderedQty: number;
    unitPrice: number;
    deliveryDate: string;
    remarks?: string;
  }[];
}

export interface UpdatePurchaseOrderRequest extends Partial<CreatePurchaseOrderRequest> {}

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

export const purchaseOrderApi = createApi({
  reducerPath: 'purchaseOrderApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3000/api/purchase-order',
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
    },
  }),
  tagTypes: TAG_TYPE_GROUPS.PURCHASE_ORDER_MODULE,
  endpoints: (builder) => ({
    // Purchase Order endpoints
    createPurchaseOrder: builder.mutation<PurchaseOrder, CreatePurchaseOrderRequest>({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [TAG_TYPES.PURCHASE_ORDER],
    }),
    getPurchaseOrders: builder.query<PurchaseOrder[], { branchId?: string }>({
      query: ({ branchId } = {}) => ({
        url: '',
        params: branchId ? { branchId } : {},
      }),
      providesTags: [TAG_TYPES.PURCHASE_ORDER],
    }),
    getPurchaseOrder: builder.query<PurchaseOrder, string>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: TAG_TYPES.PURCHASE_ORDER, id }],
    }),

    updatePurchaseOrder: builder.mutation<
      PurchaseOrder,
      { id: string; data: UpdatePurchaseOrderRequest }
    >({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: TAG_TYPES.PURCHASE_ORDER, id }],
    }),

    deletePurchaseOrder: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [TAG_TYPES.PURCHASE_ORDER],
    }),

    // Workflow endpoints
    sendToSupplier: builder.mutation<PurchaseOrder, string>({
      query: (id) => ({
        url: `/${id}/send-to-supplier`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: TAG_TYPES.PURCHASE_ORDER, id }],
    }),

    confirmPurchaseOrder: builder.mutation<PurchaseOrder, string>({
      query: (id) => ({
        url: `/${id}/confirm`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: TAG_TYPES.PURCHASE_ORDER, id }],
    }),

    cancelPurchaseOrder: builder.mutation<PurchaseOrder, string>({
      query: (id) => ({
        url: `/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: TAG_TYPES.PURCHASE_ORDER, id }],
    }),

    closePurchaseOrder: builder.mutation<PurchaseOrder, string>({
      query: (id) => ({
        url: `/${id}/close`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: TAG_TYPES.PURCHASE_ORDER, id }],
    }),

    // Create from PR
    createPurchaseOrderFromPR: builder.mutation<
      PurchaseOrder,
      { prId: string; supplierId: string }
    >({
      query: ({ prId, supplierId }) => ({
        url: `/create-from-pr/${prId}`,
        method: 'POST',
        body: { supplierId },
      }),
      invalidatesTags: [TAG_TYPES.PURCHASE_ORDER],
    }),

    // TODO: NEW MUTATION - Create PO from multiple PRs
    // TODO: createPurchaseOrderFromMultiplePRs: builder.mutation<
    // TODO:   PurchaseOrder,
    // TODO:   { prIds: string[]; supplierId: string; title?: string; notes?: string }
    // TODO: >({
    // TODO:   query: (data) => ({
    // TODO:     url: '/create-from-multiple-prs',
    // TODO:     method: 'POST',
    // TODO:     body: data,
    // TODO:   }),
    // TODO:   invalidatesTags: [TAG_TYPES.PURCHASE_ORDER],
    // TODO: }),

    // TODO: NEW MUTATION - Create PO with selective items
    // TODO: createPurchaseOrderFromPRSelective: builder.mutation<
    // TODO:   PurchaseOrder,
    // TODO:   {
    // TODO:     prId: string;
    // TODO:     supplierId: string;
    // TODO:     selectedItems: {
    // TODO:       prItemId: string;
    // TODO:       orderedQty: number;
    // TODO:       unitPrice: number;
    // TODO:       remarks?: string;
    // TODO:     }[];
    // TODO:   }
    // TODO: >({
    // TODO:   query: ({ prId, ...data }) => ({
    // TODO:     url: `/create-from-pr/${prId}/selective`,
    // TODO:     method: 'POST',
    // TODO:     body: data,
    // TODO:   }),
    // TODO:   invalidatesTags: [TAG_TYPES.PURCHASE_ORDER],
    // TODO: }),

    // Support endpoints for branches
    getBranches: builder.query<Branch[], void>({
      query: () => ({
        url: '/branches',
      }),
      providesTags: [TAG_TYPES.BRANCH],
    }),
  }),
});

export const {
  useCreatePurchaseOrderMutation,
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderQuery,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
  useSendToSupplierMutation,
  useConfirmPurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useClosePurchaseOrderMutation,
  useCreatePurchaseOrderFromPRMutation,
  useGetBranchesQuery,
  // TODO: Add exports for new mutations when implemented
  // TODO: useCreatePurchaseOrderFromMultiplePRsMutation,
  // TODO: useCreatePurchaseOrderFromPRSelectiveMutation,
} = purchaseOrderApi;
