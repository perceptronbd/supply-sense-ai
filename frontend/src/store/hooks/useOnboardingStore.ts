'use client';

import { useGetCompanyId } from '@/hooks/useGetCompanyId';
import { useAppDispatch, useAppSelector } from '.';
import { setCurrentSteps, setDbConnectionId } from '../slices/onboardingSlice';

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

  return {
    ...onboarding,
    currentStep,
    setOnboardingStep,
    saveDbConnectionId,
  };
};
