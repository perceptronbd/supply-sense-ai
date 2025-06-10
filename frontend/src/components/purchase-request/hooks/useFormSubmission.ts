import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  type PurchaseRequestFormData,
  purchaseRequestSchema,
} from '../../../lib/schemas/purchase-request.schema';
import {
  type PurchaseRequest,
  useCreatePurchaseRequestMutation,
  useUpdatePurchaseRequestMutation,
} from '../../../store/api/purchaseRequestApi';

interface UseFormSubmissionProps {
  mode: 'create' | 'edit';
  id?: string;
  formData: Partial<PurchaseRequestFormData>;
  onSuccess?: (purchaseRequest: PurchaseRequest) => void;
}

export function useFormSubmission({ mode, id, formData, onSuccess }: UseFormSubmissionProps) {
  const router = useRouter();
  const [createPurchaseRequest, { isLoading: isCreating }] = useCreatePurchaseRequestMutation();
  const [updatePurchaseRequest, { isLoading: isUpdating }] = useUpdatePurchaseRequestMutation();

  const processFormData = (data: Partial<PurchaseRequestFormData>) => {
    return {
      ...data,
      prTemplateId: data.prTemplateId === '' ? undefined : data.prTemplateId,
      description: data.description === '' ? undefined : data.description,
      justification: data.justification === '' ? undefined : data.justification,
      items:
        data.items?.map((item) => ({
          ...item,
          requestedQty: Number(item.requestedQty),
          estimatedPrice: item.estimatedPrice ? Number(item.estimatedPrice) : undefined,
          remarks: item.remarks === '' ? undefined : item.remarks,
        })) || [],
    };
  };

  const handleSubmit = async (
    e: React.FormEvent,
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string[]>>>,
    setWasSubmitted: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    console.log('handleSubmit called');
    e.preventDefault();
    setWasSubmitted(true);

    const processedFormData = processFormData(formData);
    const validation = purchaseRequestSchema.safeParse(processedFormData);

    console.log('Validation result:', validation);

    if (!validation.success) {
      console.log('Validation failed:', validation.error);
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors(fieldErrors);
      return;
    }

    try {
      let result: PurchaseRequest;

      if (mode === 'create') {
        console.log('Attempting to create purchase request:', validation.data);
        result = await createPurchaseRequest(validation.data).unwrap();
        console.log('Purchase request created successfully:', result);
      } else if (mode === 'edit' && id) {
        console.log('Attempting to update purchase request:', validation.data);
        result = await updatePurchaseRequest({
          id,
          data: validation.data,
        }).unwrap();
        console.log('Purchase request updated successfully:', result);
      } else {
        throw new Error('Invalid mode or missing ID for edit');
      }

      onSuccess?.(result);
      router.push('/purchase-requests');
    } catch (error: unknown) {
      console.error('Error saving purchase request:', error);
      const errorMessage = getErrorMessage(error);
      setErrors({ _form: [errorMessage] });
    }
  };

  const getErrorMessage = (error: unknown): string => {
    return error &&
      typeof error === 'object' &&
      'data' in error &&
      error.data &&
      typeof error.data === 'object' &&
      'message' in error.data &&
      typeof error.data.message === 'string'
      ? error.data.message
      : 'An error occurred while saving the purchase request.';
  };

  return {
    handleSubmit,
    isCreating,
    isUpdating,
  };
}
