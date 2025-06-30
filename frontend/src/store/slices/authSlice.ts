import { getUserFromToken, isTokenExpired } from '@/lib/jwt';
import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  branchId: string;
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
};

// Redux Persist configuration
const persistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user', 'token', 'isAuthenticated'], // Only persist these fields
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; access_token: string }>) => {
      const { user, access_token } = action.payload;
      state.user = user;
      state.token = access_token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    // Action to validate and restore token on app startup
    validateToken: (state) => {
      if (state.token) {
        // Check if token is expired
        if (isTokenExpired(state.token)) {
          // Token is expired, clear auth state
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        } else if (!state.user) {
          // Token exists but user data is missing, try to restore from token
          const userFromToken = getUserFromToken(state.token);
          if (userFromToken) {
            state.user = userFromToken;
            state.isAuthenticated = true;
          } else {
            // Invalid token, clear auth state
            state.token = null;
            state.isAuthenticated = false;
          }
        }
      }
    },
  },
});

const persistedAuthReducer = persistReducer(persistConfig, authSlice.reducer);

export const { setCredentials, logout, setLoading, validateToken } = authSlice.actions;
export default persistedAuthReducer;
