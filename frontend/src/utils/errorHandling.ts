/**
 * Utility functions for consistent error handling across the application
 */

export interface ErrorInfo {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Extract meaningful error message from various error types
 */
// Helper function to check if error has data property
function hasDataProperty(error: unknown): error is { data: unknown } {
  return typeof error === 'object' && error !== null && 'data' in error;
}

// Helper function to check if error has message property
function hasMessageProperty(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}

// Helper function to check if error has status property
function hasStatusProperty(error: unknown): error is { status: number } {
  return typeof error === 'object' && error !== null && 'status' in error;
}

// Helper function to get status message
function getStatusMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Bad request. Please check your input.';
    case 401:
      return 'Authentication required. Please log in.';
    case 403:
      return 'Access denied. You do not have permission.';
    case 404:
      return 'Resource not found.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return `Request failed with status ${status}`;
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Handles diverse error payload shapes from external APIs.
export function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    // RTK Query error format
    if (hasDataProperty(error) && error.data && typeof error.data === 'object') {
      const data = error.data as Record<string, unknown>;
      if (typeof data.message === 'string') return data.message;
      if (typeof data.error === 'string') return data.error;
    }

    // Standard Error object
    if (hasMessageProperty(error) && typeof error.message === 'string') {
      return error.message;
    }

    // Network or fetch errors
    if (hasStatusProperty(error)) {
      return getStatusMessage(error.status);
    }
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Create standardized error info object
 */
export function createErrorInfo(error: unknown, defaultMessage?: string): ErrorInfo {
  const message = extractErrorMessage(error) || defaultMessage || 'An error occurred';

  return {
    message,
    details: error,
  };
}

/**
 * Log error with consistent format
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void {
  const errorInfo = createErrorInfo(error);

  console.error(`[${context}] ${errorInfo.message}`, {
    error: errorInfo.details,
    ...additionalInfo,
  });
}
