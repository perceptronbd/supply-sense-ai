import type { RootState } from '@/store/store';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { TAG_TYPES } from './tagTypes';

// AI API Response Types
export interface PurchaseRecommendation {
  itemId: string;
  itemName: string;
  currentStock: number;
  recommendedQuantity: number;
  estimatedCost: number;
  urgency: 'low' | 'medium' | 'high';
  reasoning: string;
  confidence: number;
  stockoutRisk?: string;
  leadTime?: number;
}

export interface AutoPurchaseRequestsResponse {
  recommendations: PurchaseRecommendation[];
  totalEstimatedCost: number;
  priorityOrder: string[];
  metadata: {
    branchId: string;
    analysisDate: string;
    criteriaUsed: string[];
    riskFactors: string[];
  };
  createdPurchaseRequests?: Array<{
    id: string;
    prNumber: string;
    itemCount: number;
    totalAmount: number;
  }>;
}

export interface SupplierRecommendation {
  supplierId: string;
  supplierName: string;
  score: number;
  reasoning: string;
  estimatedPrice: number;
  leadTime: number;
  qualityRating: number;
  reliabilityScore: number;
}

export interface DemandForecast {
  itemId: string;
  itemName: string;
  predictedDemand: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: boolean;
  forecastDate: string;
}

export interface StockPrediction {
  itemId: string;
  itemName: string;
  currentStock: number;
  predictedStock: number;
  stockoutRisk: 'low' | 'medium' | 'high';
  daysUntilStockout: number;
  recommendedAction: string;
}

// Quality Report Types
export interface QualityReportResponse {
  period: {
    startDate: string | Date;
    endDate: string | Date;
  };
  metrics: {
    summary: {
      totalReceipts: number;
      totalItems: number;
      itemsWithIssues: number;
      qualityRate: string;
    };
    supplierPerformance: Array<{
      name: string;
      totalReceipts: number;
      itemsWithIssues: number;
      qualityRate: string;
    }>;
  };
  report: string;
  generatedAt: Date;
}

// AI API Request Types
export interface AutoPurchaseRequestsParams {
  branchId: string;
  createActualPRs?: boolean;
}

export interface SupplierRecommendationParams {
  itemIds: string[];
}

export interface DemandForecastParams {
  branchId?: string;
  itemId?: string;
  daysAhead?: number;
}

export interface StockPredictionParams {
  branchId: string;
  itemId?: string;
  daysAhead?: number;
}

export interface QualityReportParams {
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

export const aiApi = createApi({
  reducerPath: 'aiApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3000/api/ai',
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [TAG_TYPES.AI_RECOMMENDATION],
  endpoints: (builder) => ({
    // Get automatic purchase request recommendations
    getAutoPurchaseRequests: builder.query<
      AutoPurchaseRequestsResponse,
      AutoPurchaseRequestsParams
    >({
      query: ({ branchId, createActualPRs = false }) => ({
        url: `/auto-purchase-requests/${branchId}`,
        params: createActualPRs ? { createActualPRs: 'true' } : {},
      }),
      providesTags: [TAG_TYPES.AI_RECOMMENDATION],
    }),

    // Get supplier recommendations for items
    getSupplierRecommendations: builder.mutation<
      SupplierRecommendation[],
      SupplierRecommendationParams
    >({
      query: (params) => ({
        url: '/recommend-supplier',
        method: 'POST',
        body: params,
      }),
    }),

    // Get demand forecast
    getDemandForecast: builder.query<DemandForecast[], DemandForecastParams>({
      query: (params) => ({
        url: '/demand-forecast',
        params,
      }),
      providesTags: [TAG_TYPES.AI_RECOMMENDATION],
    }),

    // Get stock predictions
    getStockPredictions: builder.query<StockPrediction[], StockPredictionParams>({
      query: ({ branchId, itemId, daysAhead }) => ({
        url: `/stock-prediction/${branchId}`,
        params: { itemId, daysAhead },
      }),
      providesTags: [TAG_TYPES.AI_RECOMMENDATION],
    }),

    // Get reorder recommendations
    getReorderRecommendations: builder.query<PurchaseRecommendation[], { branchId: string }>({
      query: ({ branchId }) => ({
        url: `/reorder-recommendations/${branchId}`,
      }),
      providesTags: [TAG_TYPES.AI_RECOMMENDATION],
    }),

    // Generate purchase request recommendations (mutation for immediate execution)
    generatePurchaseRecommendations: builder.mutation<
      AutoPurchaseRequestsResponse,
      AutoPurchaseRequestsParams
    >({
      query: ({ branchId, createActualPRs = false }) => ({
        url: `/auto-purchase-requests/${branchId}`,
        method: 'GET',
        params: createActualPRs ? { createActualPRs: 'true' } : {},
      }),
      invalidatesTags: [TAG_TYPES.AI_RECOMMENDATION],
    }),

    // Get quality report
    getQualityReport: builder.query<QualityReportResponse, QualityReportParams>({
      query: (params) => ({
        url: '/quality-report',
        params,
      }),
      providesTags: [TAG_TYPES.AI_RECOMMENDATION],
    }),
  }),
});

export const {
  useGetAutoPurchaseRequestsQuery,
  useGetSupplierRecommendationsMutation,
  useGetDemandForecastQuery,
  useGetStockPredictionsQuery,
  useGetReorderRecommendationsQuery,
  useGeneratePurchaseRecommendationsMutation,
  useGetQualityReportQuery,
} = aiApi;
