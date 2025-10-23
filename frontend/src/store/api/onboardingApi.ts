import { ApiResponse } from '@supplysense/types';
import type {
  IBatchSaveMetadataPayload,
  ICaptureMetadataPayload,
  IDbConnectPayload,
  IGetTablesDto,
  IUpsertTableRelationshipsPayload,
  TCaptureMetadataResponse,
  TDbConnectionResponse,
  TGetTablesResponse,
  TRelationshipTablesResponse,
} from '@/components/onboarding/types';
import { baseApi } from './baseApi';

export const onboardingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    dbConnect: builder.mutation<TDbConnectionResponse, IDbConnectPayload>({
      query(body) {
        return {
          url: '/onboarding/db-connect',
          method: 'POST',
          body,
        };
      },
    }),

    getTables: builder.query<TGetTablesResponse, IGetTablesDto>({
      query: ({ companyId, dbConnectionId }) => ({
        url: `/onboarding/${companyId}/tables`,
        method: 'GET',
        params: { dbConnectionId },
      }),
    }),

    captureMetadata: builder.mutation<TCaptureMetadataResponse, ICaptureMetadataPayload>({
      query: (body) => ({
        url: `/onboarding/${body.companyId}/capture-metadata`,
        method: 'POST',
        body,
      }),
    }),

    saveMetadata: builder.mutation<TCaptureMetadataResponse, IBatchSaveMetadataPayload>({
      query: ({ companyId, payload }) => ({
        url: `/onboarding/${companyId}/save-metadata`,
        method: 'POST',
        body: payload, // Send payload directly, not wrapped
      }),
    }),

    getTableRelationships: builder.query<TRelationshipTablesResponse, IGetTablesDto>({
      query: ({ companyId, dbConnectionId }) => ({
        url: `/onboarding/${companyId}/relationships`,
        method: 'GET',
        params: { dbConnectionId },
      }),
    }),

    getSampleQuestions: builder.query<ApiResponse<string[]>, string>({
      query: (dbConnectionId) => ({
        url: `/table-metadata/sample-questions/${dbConnectionId}`,
        method: 'GET',
      }),
    }),

    upsertTableRelationships: builder.mutation<
      TRelationshipTablesResponse,
      { userId: string; payload: IUpsertTableRelationshipsPayload }
    >({
      query: ({ userId, payload }) => ({
        url: '/onboarding/table-relationships',
        method: 'POST',
        body: payload,
        params: { userId },
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useDbConnectMutation,
  useGetTablesQuery,
  useCaptureMetadataMutation,
  useSaveMetadataMutation,
  useGetTableRelationshipsQuery,
  useUpsertTableRelationshipsMutation,
  useGetSampleQuestionsQuery,
} = onboardingApi;
