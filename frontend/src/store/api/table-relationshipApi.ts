import type { TGetSavedTableRelationshipsResponse } from '@/components/onboarding/types';
import { baseApi } from './baseApi';
import { TAG_TYPES } from './tagTypes';

const tableRelationshipApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSavedTableRelationships: builder.query<
      TGetSavedTableRelationshipsResponse,
      { dbConnectionId: string }
    >({
      query: (params) => ({
        url: '/table-relationships',
        method: 'GET',
        params,
      }),
      providesTags: [TAG_TYPES.GET_TABLE_RELATIONSHIPS],
    }),
  }),
});

export const { useGetSavedTableRelationshipsQuery } = tableRelationshipApi;
