import {
  type BaseQueryFn,
  createApi,
  type FetchArgs,
  type FetchBaseQueryError,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';
import { config } from '../../config/env';
import { logout, setCredentials } from '../slices/authSlice';
import type { RootState } from '../store';
import { TAG_TYPES_LIST } from './tagTypes';

const baseQuery = fetchBaseQuery({
  baseUrl: config.getApiUrl('/api'),
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth?.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Try to get a new token
    const state = api.getState() as RootState;
    const refreshToken = state.auth?.refreshToken;

    if (refreshToken) {
      // Use a separate fetch or another baseQuery call to get the new token
      // We use baseQuery directly here but specify the absolute path if needed
      // Actually /auth/refresh is relative to /api
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refresh_token: refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const data = refreshResult.data as { access_token: string; refresh_token: string };
        // Store the new tokens
        const user = state.auth.user;

        if (!user) {
          throw new Error('User not found');
        }
        api.dispatch(
          setCredentials({
            user,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            company: state.auth.company || undefined,
          })
        );

        // Retry the initial query
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
      }
    } else {
      api.dispatch(logout());
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: TAG_TYPES_LIST,
  endpoints: () => ({}),
});
