import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import { getUserFromToken, isTokenExpired } from '@/lib/jwt';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  branchId: string;
  isActive: boolean;
  companyId: string;
}

interface Company {
  id: string;
  name: string;
  contactEmail: string;
  industry: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  company: Company | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  company: null,
  isAuthenticated: false,
  isLoading: false,
};

// Redux Persist configuration
const persistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user', 'token', 'isAuthenticated', 'company'], // Only persist these fields
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; access_token: string; company?: Company }>
    ) => {
      const { user, access_token, company } = action.payload;
      state.user = user;
      state.token = access_token;
      state.isAuthenticated = true;
      if (company) {
        state.company = company;
      }
    },
    // Action specifically for handling registration success with company data
    setRegistrationCredentials: (state, action: PayloadAction<{ company: Company }>) => {
      const { company } = action.payload;

      state.company = company;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.company = null;
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

export const { setCredentials, setRegistrationCredentials, logout, setLoading, validateToken } =
  authSlice.actions;
export default persistedAuthReducer;
