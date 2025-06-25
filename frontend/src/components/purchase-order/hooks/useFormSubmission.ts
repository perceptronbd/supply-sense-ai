import type { PurchaseOrderFormData } from '@/lib/schemas/purchase-order.schema';
import { getToastErrorMessage, getToastSuccessMessage } from '@/lib/utils/api-response';
import {
  type PurchaseOrder,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
} from '@/store/api/purchaseOrderApi';
import { addToast } from '@heroui/react';
import { type FormEvent } from 'react';

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

        // Show success toast
        addToast({
          ...getToastSuccessMessage(
            `Purchase order "${result.title}" created successfully with ID ${result.poNumber}`,
            'created'
          ),
          color: 'success',
        });
      } else {
        if (!id) {
          throw new Error('Purchase Order ID is required for editing');
        }
        result = await updatePurchaseOrder({ id, data: submissionData }).unwrap();

        // Show success toast
        addToast({
          ...getToastSuccessMessage(
            `Purchase order "${result.title}" updated successfully`,
            'updated'
          ),
          color: 'success',
        });
      }

      // Clear any existing errors
      setErrors({});

      // Call success handler
      onSuccess?.(result);
    } catch (error: unknown) {
      console.error('Failed to save purchase order:', error);

      // Use the centralized error handling utilities
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
