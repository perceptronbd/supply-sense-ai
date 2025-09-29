import { configureStore } from '@reduxjs/toolkit';
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, persistStore } from 'redux-persist';
import { authApi } from './api/authApi';
import { baseApi } from './api/baseApi';
import { chatApi } from './api/chatApi';
import { roleApi } from './api/roleApi';
import authSlice from './slices/authSlice';
import commonSlice from './slices/commonSlice';
import onboardingSlice from './slices/onboardingSlice';
import themeSlice from './slices/themeSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    theme: themeSlice,
    onboarding: onboardingSlice,
    commonSlice,
    [baseApi.reducerPath]: baseApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [roleApi.reducerPath]: roleApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware, authApi.middleware, chatApi.middleware, roleApi.middleware),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
