import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';
import { purchaseRequestApi } from './api/purchaseRequestApi';
import authSlice from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    [authApi.reducerPath]: authApi.reducer,
    [purchaseRequestApi.reducerPath]: purchaseRequestApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, purchaseRequestApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
