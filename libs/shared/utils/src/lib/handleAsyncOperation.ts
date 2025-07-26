import { ApiResponse } from '@supplysense/types';

import { toast } from './toast';

// Higher-order function that wraps any async operation with try-catch
export const handleAsyncOperation = async <T>(
  operation: () => Promise<ApiResponse<T>>,
  options: {
    onSuccess?: (result: Awaited<ApiResponse<T>>) => void;
    onError?: (error: unknown) => void;

    showSuccessMessage?: boolean;
  } = {
    showSuccessMessage: true,
  }
): Promise<ApiResponse<T> | null> => {
  try {
    const result: ApiResponse<T> = await operation();
    if (result.success && result.data) {
      options?.onSuccess?.(result);
    }
    if (options?.showSuccessMessage && result.success) {
      toast.success({
        title: result.message,
        description: 'The operation completed successfully.',
      });
    }
    return result;
  } catch (error) {
    if (options?.onError) {
      options.onError(error);
    } else {
      toast.error(error);
    }
    return null;
  }
};
