import { configureStore } from '@reduxjs/toolkit';
import { FLUSH, PAUSE, PERSIST, PURGE, persistStore, REGISTER, REHYDRATE } from 'redux-persist';
import { authApi } from './api/authApi';
import { baseApi } from './api/baseApi';
import { chatApi } from './api/chatApi';
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
    [chatApi.reducerPath]: chatApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware, authApi.middleware, chatApi.middleware),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
