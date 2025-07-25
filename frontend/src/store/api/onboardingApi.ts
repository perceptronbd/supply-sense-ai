import type { IDbConnectPayload } from '@/components/onboarding/db-connection/types';
import { baseApi } from './baseApi';

export const onboardingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    dbConnect: builder.mutation<unknown, IDbConnectPayload>({
      query(body) {
        return {
          url: '/onboarding/db-connect',
          method: 'POST',
          body,
        };
      },
    }),
  }),
  overrideExisting: false,
});

export const { useDbConnectMutation } = onboardingApi;
