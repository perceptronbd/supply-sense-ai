import { configureStore } from '@reduxjs/toolkit';
import { aiApi } from './api/aiApi';
import { authApi } from './api/authApi';
import { branchApi } from './api/branchApi';
import { chatApi } from './api/chatApi';
import { itemApi } from './api/itemApi';
import { purchaseOrderApi } from './api/purchaseOrderApi';
import { purchaseRequestApi } from './api/purchaseRequestApi';
import { supplierApi } from './api/supplierApi';
import authSlice from './slices/authSlice';
import themeSlice from './slices/themeSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    theme: themeSlice,
    [authApi.reducerPath]: authApi.reducer,
    [branchApi.reducerPath]: branchApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
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
      chatApi.middleware,
      itemApi.middleware,
      purchaseRequestApi.middleware,
      purchaseOrderApi.middleware,
      supplierApi.middleware,
      aiApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
