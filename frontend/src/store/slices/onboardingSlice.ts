import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import persistReducer from 'redux-persist/es/persistReducer';
import storage from 'redux-persist/lib/storage';

// Redux Persist configuration
const persistConfig = {
  key: 'onboarding',
  storage,
  whitelist: ['currentStep', 'dbConnectionId'] as OnboardingState[], // Only persist these fields
};

const initialState = {
  currentStep: 1,
  dbConnectionId: '',
};

type OnboardingState = keyof typeof initialState;

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    setDbConnectionId: (state, action: PayloadAction<string>) => {
      state.dbConnectionId = action.payload;
    },
  },
});

export const { setCurrentStep, setDbConnectionId } = onboardingSlice.actions;

const persistedOnboardingReducer = persistReducer(persistConfig, onboardingSlice.reducer);

export default persistedOnboardingReducer;
