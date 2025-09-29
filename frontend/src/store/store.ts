import { configureStore } from '@reduxjs/toolkit';
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, persistStore } from 'redux-persist';
import { aiApi } from './api/aiApi';
import { authApi } from './api/authApi';
import { baseApi } from './api/baseApi';
import { branchApi } from './api/branchApi';
import { chatApi } from './api/chatApi';
import { goodsReceiptApi } from './api/goodsReceiptApi';
import { itemApi } from './api/itemApi';
import { purchaseOrderApi } from './api/purchaseOrderApi';
import { purchaseRequestApi } from './api/purchaseRequestApi';
import { roleApi } from './api/roleApi';
import { supplierApi } from './api/supplierApi';
import { userApi } from './api/userApi';
import authSlice from './slices/authSlice';
import chatSlice from './slices/chatSlice';
import commonSlice from './slices/commonSlice';
import onboardingSlice from './slices/onboardingSlice';
import themeSlice from './slices/themeSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    chat: chatSlice,
    theme: themeSlice,
    onboarding: onboardingSlice,
    commonSlice,
    [baseApi.reducerPath]: baseApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [branchApi.reducerPath]: branchApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [goodsReceiptApi.reducerPath]: goodsReceiptApi.reducer,
    [itemApi.reducerPath]: itemApi.reducer,
    [purchaseRequestApi.reducerPath]: purchaseRequestApi.reducer,
    [purchaseOrderApi.reducerPath]: purchaseOrderApi.reducer,
    [roleApi.reducerPath]: roleApi.reducer,
    [supplierApi.reducerPath]: supplierApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [aiApi.reducerPath]: aiApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      baseApi.middleware,
      authApi.middleware,
      branchApi.middleware,
      chatApi.middleware,
      goodsReceiptApi.middleware,
      itemApi.middleware,
      purchaseRequestApi.middleware,
      purchaseOrderApi.middleware,
      roleApi.middleware,
      supplierApi.middleware,
      userApi.middleware,
      aiApi.middleware
    ),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
