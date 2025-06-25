/**
 * API Response Utilities
 *
 * This module provides utilities for handling standardized API responses and errors
 * across the frontend application. It ensures consistent data extraction and error
 * handling that matches the backend's ResponseInterceptor format.
 */

// Type definitions for standardized API responses
export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  metadata?: {
    timestamp: string;
    path: string;
    version?: string;
    correlationId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  metadata: {
    timestamp: string;
    path: string;
    version?: string;
    correlationId?: string;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  error?: string;
  details?: unknown;
  metadata?: {
    timestamp: string;
    path: string;
    version?: string;
    correlationId?: string;
  };
}

// Axios error response structure
export interface AxiosErrorResponse {
  response?: {
    data: ApiError;
    status: number;
    statusText: string;
  };
  message: string;
  code?: string;
}

/**
 * Extracts data from a standardized API response
 * @param response - The API response object
 * @returns The data property from the response
 */
export function extractApiData<T>(response: ApiResponse<T>): T | undefined {
  return response.data;
}

/**
 * Extracts pagination metadata from a paginated API response
 * @param response - The paginated API response object
 * @returns The pagination metadata or null if not available
 */
export function extractPaginationData<T>(
  response: PaginatedResponse<T>
): PaginatedResponse<T>['metadata']['pagination'] | null {
  return response.metadata?.pagination || null;
}

/**
 * Checks if an API response is paginated
 * @param response - The API response object
 * @returns True if the response contains pagination metadata
 */
export function isPaginatedResponse<T>(
  response: ApiResponse<T[] | T>
): response is PaginatedResponse<T> {
  return !!response.metadata?.pagination;
}

/**
 * Transforms RTK Query response to extract data directly
 * This is useful for RTK Query's transformResponse option
 * @param response - The standardized API response
 * @returns The extracted data (throws if data is undefined for required responses)
 */
export function transformApiResponse<T>(response: ApiResponse<T>): T {
  // Debug logging to understand what's being passed
  console.log('transformApiResponse received:', response);

  const data = extractApiData(response);
  if (data === undefined) {
    console.error('Response data is undefined. Full response:', response);
    throw new Error('Expected data in API response but received undefined');
  }
  return data;
}

/**
 * Transforms RTK Query response to extract data directly (allows undefined)
 * Use this for optional data responses
 * @param response - The standardized API response
 * @returns The extracted data or undefined
 */
export function transformOptionalApiResponse<T>(response: ApiResponse<T>): T | undefined {
  return extractApiData(response);
}

/**
 * Transforms RTK Query paginated response to maintain both data and pagination
 * @param response - The standardized paginated API response
 * @returns Object containing data and pagination metadata
 */
export function transformPaginatedResponse<T>(response: PaginatedResponse<T>): {
  data: T[];
  pagination: PaginatedResponse<T>['metadata']['pagination'];
} {
  return {
    data: response.data || [],
    pagination: response.metadata.pagination,
  };
}

/**
 * Transforms RTK Query response that could be either paginated or non-paginated
 * This handles the backend's flexible response structure where non-paginated requests
 * return arrays directly, while paginated requests return the full pagination structure
 * @param response - Either a paginated response or a simple array response
 * @returns Object containing data and optional pagination metadata
 */
export function transformFlexibleResponse<T>(response: PaginatedResponse<T> | ApiResponse<T[]>): {
  data: T[];
  pagination?: PaginatedResponse<T>['metadata']['pagination'];
} {
  // Check if response has pagination metadata
  if (response.metadata && 'pagination' in response.metadata) {
    return transformPaginatedResponse(response as PaginatedResponse<T>);
  }

  // Handle non-paginated response (array data)
  return {
    data: response.data || [],
    pagination: undefined,
  };
}

/**
 * Handles API errors consistently across the application
 * @param error - The error object (usually from RTK Query or Axios)
 * @returns Formatted error information
 */
export function handleApiError(error: unknown): {
  message: string;
  statusCode?: number;
  details?: unknown;
  error?: string;
  correlationId?: string;
} {
  // Handle RTK Query error with backend ApiErrorResponseDto structure
  if (error && typeof error === 'object' && 'data' in error) {
    const rtkError = error as {
      data: {
        success: false;
        statusCode: number;
        message: string;
        error?: string;
        details?: Record<string, unknown> | string[];
        metadata: {
          timestamp: string;
          path: string;
          correlationId: string;
        };
      };
      status: number;
    };

    if (rtkError.data) {
      return {
        message: rtkError.data.message || 'An error occurred',
        statusCode: rtkError.data.statusCode || rtkError.status,
        details: rtkError.data.details,
        error: rtkError.data.error,
        correlationId: rtkError.data.metadata?.correlationId,
      };
    }
  }

  // Handle legacy RTK Query error format (fallback)
  if (error && typeof error === 'object' && 'data' in error) {
    const rtkError = error as { data: ApiError; status: number };
    return {
      message: rtkError.data.message || 'An error occurred',
      statusCode: rtkError.data.statusCode || rtkError.status,
      details: rtkError.data.details,
    };
  }

  // Handle Axios error
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosErrorResponse;
    return {
      message: axiosError.response?.data.message || axiosError.message || 'An error occurred',
      statusCode: axiosError.response?.status,
      details: axiosError.response?.data.details,
    };
  }

  // Handle generic error
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  // Fallback for unknown error types
  return {
    message: 'An unexpected error occurred',
  };
}

/**
 * Creates a standardized error message for UI display
 * @param error - The error object
 * @param fallbackMessage - Fallback message if error details are not available
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown, fallbackMessage = 'Something went wrong'): string {
  const errorInfo = handleApiError(error);
  return errorInfo.message || fallbackMessage;
}

/**
 * Checks if an API response indicates success
 * @param response - The API response object
 * @returns True if the response indicates success
 */
export function isApiSuccess<T>(response: ApiResponse<T>): boolean {
  return response.success === true && response.statusCode >= 200 && response.statusCode < 300;
}

/**
 * Type guard to check if a response is an API error
 * @param response - The response object to check
 * @returns True if the response is an API error
 */
export function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    (response as ApiError).success === false
  );
}

/**
 * Utility for consistent toast error messages
 * Extracts user-friendly error messages for display in toast notifications
 * @param error - The error object
 * @returns Object containing title and description for toast notifications
 */
export function getToastErrorMessage(error: unknown): {
  title: string;
  description: string;
  correlationId?: string;
} {
  const errorInfo = handleApiError(error);

  // Customize title based on status code
  let title = 'Error';
  if (errorInfo.statusCode) {
    switch (errorInfo.statusCode) {
      case 400:
        title = 'Invalid Request';
        break;
      case 401:
        title = 'Authentication Failed';
        break;
      case 403:
        title = 'Access Denied';
        break;
      case 404:
        title = 'Not Found';
        break;
      case 429:
        title = 'Too Many Requests';
        break;
      case 500:
        title = 'Server Error';
        break;
      case 503:
        title = 'Service Unavailable';
        break;
      default:
        title = 'Error';
    }
  }

  return {
    title,
    description: errorInfo.message,
    correlationId: errorInfo.correlationId,
  };
}

/**
 * Utility for consistent toast success messages
 * @param message - Custom success message
 * @param action - The action that was performed (e.g., 'created', 'updated', 'deleted')
 * @returns Object containing title and description for toast notifications
 */
export function getToastSuccessMessage(
  message?: string,
  action?: string
): {
  title: string;
  description: string;
} {
  const defaultMessage = action
    ? `Resource ${action} successfully`
    : 'Operation completed successfully';

  return {
    title: 'Success',
    description: message || defaultMessage,
  };
}

/**
 * Helper to extract correlation ID from API response for debugging
 * @param response - The API response object
 * @returns The correlation ID if available
 */
export function getCorrelationId<T>(response: ApiResponse<T>): string | undefined {
  return response.metadata?.correlationId;
}

/**
 * Helper to check if API response has data
 * @param response - The API response object
 * @returns True if response has data
 */
export function hasApiData<T>(response: ApiResponse<T>): response is ApiResponse<T> & { data: T } {
  return response.data !== undefined && response.data !== null;
}
