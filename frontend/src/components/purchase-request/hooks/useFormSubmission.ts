import {
  type PurchaseRequestFormData,
  purchaseRequestSchema,
} from '@/lib/schemas/purchase-request.schema';
import { getToastErrorMessage, getToastSuccessMessage } from '@/lib/utils/api-response';
import {
  type PurchaseRequest,
  useCreatePurchaseRequestMutation,
  useUpdatePurchaseRequestMutation,
} from '@/store/api/purchaseRequestApi';
import { addToast } from '@heroui/react';

interface UseFormSubmissionProps {
  mode: 'create' | 'edit';
  id?: string;
  formData: Partial<PurchaseRequestFormData>;
  onSuccess?: (purchaseRequest: PurchaseRequest) => void;
}

export function useFormSubmission({ mode, id, formData, onSuccess }: UseFormSubmissionProps) {
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

      // Show validation error toast
      addToast({
        title: 'Validation Error',
        description: 'Please fix the highlighted fields and try again.',
        color: 'danger',
      });
      return;
    }

    try {
      let result: PurchaseRequest;

      if (mode === 'create') {
        console.log('Attempting to create purchase request:', validation.data);
        result = await createPurchaseRequest(validation.data).unwrap();
        console.log('Purchase request created successfully:', result);

        // Show success toast
        addToast({
          ...getToastSuccessMessage(
            `Purchase request "${result.title}" created successfully with ID ${result.prNumber}`,
            'created'
          ),
          color: 'success',
        });
      } else if (mode === 'edit' && id) {
        console.log('Attempting to update purchase request:', validation.data);
        result = await updatePurchaseRequest({
          id,
          data: validation.data,
        }).unwrap();
        console.log('Purchase request updated successfully:', result);

        // Show success toast
        addToast({
          ...getToastSuccessMessage(
            `Purchase request "${result.title}" updated successfully`,
            'updated'
          ),
          color: 'success',
        });
      } else {
        throw new Error('Invalid mode or missing ID for edit');
      }

      // Clear any existing errors
      setErrors({});

      onSuccess?.(result);
    } catch (error: unknown) {
      console.error('Error saving purchase request:', error);

      // Use the global error handling utilities
      const toastError = getToastErrorMessage(error);

      // Show error toast using the structured error from backend
      addToast({
        title: toastError.title,
        description: toastError.description,
        color: 'danger',
      });

      // Set form error for display (using the structured message from backend)
      setErrors({ _form: [toastError.description] });
    }
  };

  return {
    handleSubmit,
    isCreating,
    isUpdating,
  };
}
