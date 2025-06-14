import { type GRItemFormData } from '@/lib/schemas/goods-receipt.schema';
import { addToast } from '@heroui/react';
import { type AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { type FormEvent, useState } from 'react';
import { type ZodIssue, type ZodSchema } from 'zod';

// Form submission hook
interface UseFormSubmissionProps<T, R = unknown> {
  schema: ZodSchema<T>;
  formData: T;
  createMutation: (data: T) => { unwrap: () => Promise<R> };
  updateMutation?: (params: { id: string; data: T }) => { unwrap: () => Promise<R> };
  id?: string;
  onSuccess?: (result: R) => void;
  router: AppRouterInstance;
  redirectPath: string;
}

export function useFormSubmission<T, R = unknown>({
  schema,
  formData,
  createMutation,
  updateMutation,
  id,
  onSuccess,
  router,
  redirectPath,
}: UseFormSubmissionProps<T, R>) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValidationErrors = (
    error: unknown,
    setErrors: (errors: Record<string, string[]>) => void
  ) => {
    const err = error as {
      data?: { errors?: Record<string, string[]> };
      issues?: ZodIssue[];
      message?: string;
    };

    if (err?.data?.errors) {
      setErrors(err.data.errors);
    } else if (err?.issues) {
      // Zod validation errors
      const validationErrors: Record<string, string[]> = {};
      for (const issue of err.issues) {
        const path = issue.path.join('.');
        if (!validationErrors[path]) {
          validationErrors[path] = [];
        }
        validationErrors[path].push(issue.message);
      }
      setErrors(validationErrors);
    } else {
      setErrors({
        _form: [err?.message || 'An unexpected error occurred'],
      });
    }
  };

  const executeAction = async (validatedData: T): Promise<R> => {
    if (id && updateMutation) {
      // Update existing record
      const result = await updateMutation({ id, data: validatedData }).unwrap();
      addToast({
        title: 'Success',
        description: 'Goods receipt updated successfully',
        color: 'success',
        variant: 'flat',
      });
      return result as R;
    }

    // Create new record
    const result = await createMutation(validatedData).unwrap();
    addToast({
      title: 'Success',
      description: 'Goods receipt created successfully',
      color: 'success',
      variant: 'flat',
    });
    return result as R;
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>,
    setErrors: (errors: Record<string, string[]>) => void,
    setWasSubmitted: (wasSubmitted: boolean) => void
  ) => {
    e.preventDefault();
    setWasSubmitted(true);
    setIsSubmitting(true);

    try {
      // Validate form data
      const validatedData = schema.parse(formData);
      const result = await executeAction(validatedData);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result);
      } else {
        // Default redirect
        router.push(redirectPath);
      }
    } catch (error: unknown) {
      handleValidationErrors(error, setErrors);

      addToast({
        title: 'Error',
        description: 'Failed to save goods receipt. Please check the form for errors.',
        color: 'danger',
        variant: 'flat',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleSubmit,
  };
}

// Item management hook
interface UseItemManagementProps<T> {
  formData: T & { items: GRItemFormData[] };
  setFormData: (data: T & { items: GRItemFormData[] }) => void;
  errors: Record<string, string[]>;
  setErrors: (errors: Record<string, string[]>) => void;
}

export function useItemManagement<T>({
  formData,
  setFormData,
  errors,
  setErrors,
}: UseItemManagementProps<T>) {
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const handleAddItem = (item: GRItemFormData) => {
    setFormData({
      ...formData,
      items: [...formData.items, item],
    });
    setShowItemForm(false);
    // Clear items errors
    if (errors.items) {
      setErrors({ ...errors, items: [] });
    }
  };

  const handleEditItem = (index: number, item: GRItemFormData) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = item;
    setFormData({
      ...formData,
      items: updatedItems,
    });
    setShowItemForm(false);
    setEditingItemIndex(null);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      items: updatedItems,
    });
  };

  const calculateTotalAmount = () => {
    return formData.items.reduce((total, item) => {
      const receivedQty = item.receivedQty || 0;
      const unitPrice = item.unitPrice || 0;
      return total + receivedQty * unitPrice;
    }, 0);
  };

  return {
    showItemForm,
    setShowItemForm,
    editingItemIndex,
    setEditingItemIndex,
    handleAddItem,
    handleEditItem,
    handleRemoveItem,
    calculateTotalAmount,
  };
}
