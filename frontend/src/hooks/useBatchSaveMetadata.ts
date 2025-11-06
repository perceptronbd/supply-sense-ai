import { addToast } from '@heroui/react';
import { handleAsyncOperation } from '@supplysense/utils';
import { useCallback } from 'react';
import type { IGeneratedMetadata } from '@/components/onboarding/types';
import { useSaveMetadataMutation } from '@/store/api/onboardingApi';
import { useGetCompanyId } from './useGetCompanyId';

interface UseBatchSaveMetadataProps {
  dbConnectionId: string;
  onSuccess?: () => void;
}

export const useBatchSaveMetadata = ({ dbConnectionId, onSuccess }: UseBatchSaveMetadataProps) => {
  const { companyId } = useGetCompanyId();
  const [batchSaveMetadata, { isLoading: isSaving }] = useSaveMetadataMutation();

  const saveBatchMetadata = useCallback(
    async (metadata: IGeneratedMetadata[]) => {
      if (!companyId) {
        addToast({
          title: 'The company ID was not found',
          description: 'Please try again later',
          variant: 'flat',
          color: 'danger',
        });
        return;
      }

      const tableMetadata = metadata.map((item) => ({
        tableName: item.tableName,
        friendlyLabel: item.friendlyLabel,
        purpose: item.purpose,
        updateFrequency: item.updateFrequency,
        dataSensitivity: item.dataSensitivity || '',
        sampleQuestions: item.sampleQuestions,
      }));

      const payload = {
        companyId,
        payload: {
          dbConnectionId,
          tableMetadata,
        },
      };

      await handleAsyncOperation(
        async () => {
          const result = await batchSaveMetadata(payload).unwrap();
          return result;
        },
        {
          onSuccess,
        }
      );
    },
    [batchSaveMetadata, companyId, dbConnectionId, onSuccess]
  );

  return { saveBatchMetadata, isSaving };
};
