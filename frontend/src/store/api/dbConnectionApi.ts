import { transformApiResponse } from '@/lib/utils';
import { ApiResponse } from '@supplysense/types';
import { DatabaseConnection } from 'types/db-connection.type';
import { baseApi } from './baseApi';
import { TAG_TYPES } from './tagTypes';

const dbConnectionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Database connections management
    getDatabaseConnections: builder.query<DatabaseConnection[], string>({
      query: (companyId) => `/connections/${companyId}`,
      transformResponse: (response: ApiResponse<DatabaseConnection[]>) =>
        transformApiResponse(response),
      providesTags: [TAG_TYPES.DATABASE_CONNECTION],
    }),
  }),
});

export const { useGetDatabaseConnectionsQuery } = dbConnectionApi;
