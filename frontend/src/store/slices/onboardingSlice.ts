import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import persistReducer from 'redux-persist/es/persistReducer';
import storage from 'redux-persist/lib/storage';
import type { IGeneratedMetadata } from '@/components/onboarding/types';

const WHITE_LISTED_FIELDS = [
  'currentSteps',
  'dbConnectionId',
  'generatedMetadata',
] as OnboardingState[];

// Redux Persist configuration
const persistConfig = {
  key: 'onboarding',
  storage,
  whitelist: WHITE_LISTED_FIELDS, // Only persist these fields
};

const initialState = {
  currentSteps: {} as Record<string, number>, // Maps companyId to current step
  dbConnectionId: '',
  generatedMetadata: [] as IGeneratedMetadata[],
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
    setGeneratedMetadata: (state, action: PayloadAction<IGeneratedMetadata[]>) => {
      state.generatedMetadata = action.payload;
    },
    updateMetadataItem: (
      state,
      action: PayloadAction<{
        tableName: string;
        updates: Partial<IGeneratedMetadata>;
      }>
    ) => {
      const { tableName, updates } = action.payload;
      const index = state.generatedMetadata.findIndex((item) => item.tableName === tableName);
      if (index !== -1) {
        state.generatedMetadata[index] = {
          ...state.generatedMetadata[index],
          ...updates,
        };
      }
    },
  },
});

export const { setCurrentSteps, setDbConnectionId, setGeneratedMetadata, updateMetadataItem } =
  onboardingSlice.actions;

const persistedOnboardingReducer = persistReducer(persistConfig, onboardingSlice.reducer);

export default persistedOnboardingReducer;
