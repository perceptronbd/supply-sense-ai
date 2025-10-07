'use client';

import type { IGeneratedMetadata } from '@/components/onboarding/types/capture-metadata';
import { useGetCompanyId } from '@/hooks/useGetCompanyId';
import {
  setCurrentSteps,
  setDbConnectionId,
  setGeneratedMetadata,
  updateMetadataItem,
} from '../slices/onboardingSlice';
import { useAppDispatch, useAppSelector } from '.';

export const useOnboardingStore = () => {
  const dispatch = useAppDispatch();
  const onboarding = useAppSelector((state) => state.onboarding);
  const { companyId } = useGetCompanyId();

  const currentStep = onboarding.currentSteps[companyId] || 1;

  const setOnboardingStep = (step: number) => {
    dispatch(setCurrentSteps({ [companyId]: step }));
  };

  const saveDbConnectionId = (id: string) => {
    dispatch(setDbConnectionId(id));
  };

  const saveGeneratedMetadata = (metadata: IGeneratedMetadata[]) => {
    dispatch(setGeneratedMetadata(metadata));
  };

  const updateMetadata = (tableName: string, updates: Partial<IGeneratedMetadata>) => {
    dispatch(updateMetadataItem({ tableName, updates }));
  };

  return {
    ...onboarding,
    currentStep,
    setOnboardingStep,
    saveDbConnectionId,
    saveGeneratedMetadata,
    updateMetadata,
  };
};
