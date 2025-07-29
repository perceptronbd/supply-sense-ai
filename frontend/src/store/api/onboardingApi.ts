import type {
  ICaptureMetadataPayload,
  IDbConnectPayload,
  IGetTablesDto,
  ISaveMetadataPayload,
  TCaptureMetadataResponse,
  TDbConnectionResponse,
  TGetTablesResponse,
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
    saveMetadata: builder.mutation<TCaptureMetadataResponse, ISaveMetadataPayload>({
      query: ({ companyId, payload }) => ({
        url: `/onboarding/${companyId}/save-metadata`,
        method: 'POST',
        body: { ...payload },
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
} = onboardingApi;
