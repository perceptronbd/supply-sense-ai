import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import persistReducer from 'redux-persist/es/persistReducer';
import storage from 'redux-persist/lib/storage';

// Redux Persist configuration
const persistConfig = {
  key: 'onboarding',
  storage,
  whitelist: ['currentSteps', 'dbConnectionId'] as OnboardingState[], // Only persist these fields
};

const initialState = {
  currentSteps: {} as Record<string, number>, // Maps companyId to current step
  dbConnectionId: '',
};

type OnboardingState = keyof typeof initialState;

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    setCurrentSteps: (state, action: PayloadAction<Record<string, number>>) => {
      state.currentSteps = action.payload;
    },
    setDbConnectionId: (state, action: PayloadAction<string>) => {
      state.dbConnectionId = action.payload;
    },
  },
});

export const { setCurrentSteps, setDbConnectionId } = onboardingSlice.actions;

const persistedOnboardingReducer = persistReducer(persistConfig, onboardingSlice.reducer);

export default persistedOnboardingReducer;
