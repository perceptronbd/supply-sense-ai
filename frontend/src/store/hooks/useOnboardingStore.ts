import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '.';
import { setCurrentStep, setDbConnectionId } from '../slices/onboardingSlice';

export const useOnboardingStore = () => {
  const dispatch = useAppDispatch();
  const onboarding = useAppSelector((state) => state.onboarding);

  const setOnboardingStep = useCallback(
    (step: number) => {
      dispatch(setCurrentStep(step));
    },
    [dispatch]
  );
  const saveDbConnectionId = useCallback(
    (id: string) => {
      dispatch(setDbConnectionId(id));
    },
    [dispatch]
  );

  return {
    ...onboarding,
    setOnboardingStep,
    saveDbConnectionId,
  };
};
