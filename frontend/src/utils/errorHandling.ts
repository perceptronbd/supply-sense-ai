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
export function extractErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
        return error;
    }

    if (error && typeof error === 'object') {
        // RTK Query error format
        if ('data' in error && error.data && typeof error.data === 'object') {
            const data = error.data as any;
            if (data.message) return data.message;
            if (data.error) return data.error;
        }

        // Standard Error object
        if ('message' in error && typeof (error as any).message === 'string') {
            return (error as any).message;
        }

        // Network or fetch errors
        if ('status' in error) {
            const status = (error as any).status;
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
export function logError(context: string, error: unknown, additionalInfo?: Record<string, unknown>): void {
    const errorInfo = createErrorInfo(error);

    console.error(`[${context}] ${errorInfo.message}`, {
        error: errorInfo.details,
        ...additionalInfo,
    });
}