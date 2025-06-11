import { configureStore } from '@reduxjs/toolkit';
import { aiApi } from './api/aiApi';
import { authApi } from './api/authApi';
import { branchApi } from './api/branchApi';
import { itemApi } from './api/itemApi';
import { purchaseOrderApi } from './api/purchaseOrderApi';
import { purchaseRequestApi } from './api/purchaseRequestApi';
import { supplierApi } from './api/supplierApi';
import authSlice from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    [authApi.reducerPath]: authApi.reducer,
    [branchApi.reducerPath]: branchApi.reducer,
    [itemApi.reducerPath]: itemApi.reducer,
    [purchaseRequestApi.reducerPath]: purchaseRequestApi.reducer,
    [purchaseOrderApi.reducerPath]: purchaseOrderApi.reducer,
    [supplierApi.reducerPath]: supplierApi.reducer,
    [aiApi.reducerPath]: aiApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      branchApi.middleware,
      itemApi.middleware,
      purchaseRequestApi.middleware,
      purchaseOrderApi.middleware,
      supplierApi.middleware,
      aiApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
