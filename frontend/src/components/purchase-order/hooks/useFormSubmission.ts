import { type FormEvent } from 'react';
import type { PurchaseOrderFormData } from '../../../lib/schemas/purchase-order.schema';
import {
  type PurchaseOrder,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
} from '../../../store/api/purchaseOrderApi';

interface UseFormSubmissionProps {
  mode: 'create' | 'edit';
  id?: string;
  formData: Partial<PurchaseOrderFormData>;
  onSuccess?: (purchaseOrder: PurchaseOrder) => void;
}

// Helper function to prepare submission data
function prepareSubmissionData(formData: Partial<PurchaseOrderFormData>) {
  return {
    title: formData.title || '',
    prId: formData.prId || undefined,
    supplierId: formData.supplierId || '',
    expectedDeliveryDate: formData.expectedDeliveryDate
      ? convertToISOString(formData.expectedDeliveryDate)
      : '',
    paymentTerms: formData.paymentTerms || undefined,
    deliveryTerms: formData.deliveryTerms || undefined,
    branchId: formData.branchId || '',
    notes: formData.notes || undefined,
    items: (formData.items || []).map((item) => ({
      itemId: item.itemId,
      orderedQty: Number(item.orderedQty),
      unitPrice: Number(item.unitPrice),
      deliveryDate: convertToISOString(item.deliveryDate),
      remarks: item.remarks || undefined,
    })),
  };
}

// Helper function to convert date string to ISO 8601 format
function convertToISOString(dateString: string): string {
  if (!dateString) return '';

  // If already in ISO format, return as is
  if (dateString.includes('T') || dateString.includes('Z')) {
    return dateString;
  }

  // Convert YYYY-MM-DD to ISO format
  // Add time component to make it a valid ISO 8601 string
  const date = new Date(`${dateString}T00:00:00.000Z`);
  return date.toISOString();
}

// Helper function to extract error message from RTK Query errors
function extractErrorMessage(error: unknown): string {
  const defaultMessage = 'Failed to save purchase order. Please check your data and try again.';

  if (!error || typeof error !== 'object') {
    return typeof error === 'string' ? error : defaultMessage;
  }

  // Handle RTK Query FetchBaseQueryError
  if ('status' in error) {
    const rtkError = error as {
      status: number | string;
      data?: {
        message?: string | string[];
        error?: string;
      };
      error?: string;
    };

    if (rtkError.data?.message) {
      return Array.isArray(rtkError.data.message)
        ? rtkError.data.message.join(', ')
        : rtkError.data.message;
    }

    if (rtkError.data?.error) {
      return rtkError.data.error;
    }

    if (rtkError.error) {
      return rtkError.error;
    }
  }

  // Handle regular Error objects
  if ('message' in error) {
    return (error as Error).message;
  }

  return defaultMessage;
}

export function useFormSubmission({ mode, id, formData, onSuccess }: UseFormSubmissionProps) {
  const [createPurchaseOrder, { isLoading: isCreating }] = useCreatePurchaseOrderMutation();
  const [updatePurchaseOrder, { isLoading: isUpdating }] = useUpdatePurchaseOrderMutation();

  const handleSubmit = async (
    e: FormEvent,
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string[]>>>,
    setWasSubmitted: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    e.preventDefault();
    setWasSubmitted(true);
    try {
      const submissionData = prepareSubmissionData(formData);

      let result: PurchaseOrder;
      if (mode === 'create') {
        result = await createPurchaseOrder(submissionData).unwrap();
      } else {
        if (!id) {
          throw new Error('Purchase Order ID is required for editing');
        }
        result = await updatePurchaseOrder({ id, data: submissionData }).unwrap();
      }

      // Call success handler
      onSuccess?.(result);
    } catch (error: unknown) {
      console.error('Failed to save purchase order:', error);

      const errorMessage = extractErrorMessage(error);

      setErrors((prev) => ({
        ...prev,
        _form: [errorMessage],
      }));
    }
  };

  return {
    handleSubmit,
    isCreating,
    isUpdating,
  };
}
