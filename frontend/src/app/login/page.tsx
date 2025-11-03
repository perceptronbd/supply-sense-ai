'use client';

import { addToast } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { z } from 'zod';
import { LoginLayout } from '@/components/pages/LoginLayout';
import { ROUTE_PATHS } from '@/config/routes';
import { getToastErrorMessage } from '@/lib/utils/api-response';
import { useLoginMutation } from '@/store/api/authApi';
import { clearRegistrationCredentials, setCredentials } from '@/store/slices/authSlice';

// Login form validation schema
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const router = useRouter();

  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: [] }));
    }
  };

  const validateForm = (): boolean => {
    const validationResult = loginSchema.safeParse(formData);

    if (validationResult.success) {
      setFieldErrors({});
      return true;
    }

    const errors: Record<string, string[]> = {};
    for (const issue of validationResult.error.issues) {
      const fieldName = issue.path[0] as string;
      if (!errors[fieldName]) {
        errors[fieldName] = [];
      }
      errors[fieldName].push(issue.message);
    }

    setFieldErrors(errors);
    return false;
  };

  const getDetailedErrorMessage = (error: unknown): string => {
    const rtkErrorMessage = handleRtkQueryError(error);
    if (rtkErrorMessage) return rtkErrorMessage;

    const networkErrorMessage = handleNetworkError(error);
    if (networkErrorMessage) return networkErrorMessage;

    const toastError = getToastErrorMessage(error);
    return toastError.description || 'An unexpected error occurred. Please try again.';
  };

  const handleRtkQueryError = (error: unknown): string | null => {
    if (!error || typeof error !== 'object' || !('data' in error)) {
      return null;
    }

    const rtkError = error as {
      status: number;
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
    };

    if (!rtkError.data?.message) return null;

    const backendMessage = rtkError.data.message;
    const statusCode = rtkError.data.statusCode || rtkError.status;

    return getStatusCodeMessage(statusCode, backendMessage);
  };

  const getStatusCodeMessage = (statusCode: number, backendMessage: string): string => {
    switch (statusCode) {
      case 401:
        return handleAuthError(backendMessage);
      case 403:
        return handleForbiddenError(backendMessage);
      case 404:
        return 'Login service not found. Please try again later.';
      case 429:
        return 'Too many login attempts. Please wait a few minutes before trying again.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return handleDefaultError(backendMessage);
    }
  };

  const handleAuthError = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('onboarding')) {
      return message;
    }
    if (
      lowerMessage.includes('invalid') ||
      lowerMessage.includes('wrong') ||
      lowerMessage.includes('incorrect')
    ) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    return 'Authentication failed. Please check your credentials and try again.';
  };

  const handleForbiddenError = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('disabled') || lowerMessage.includes('inactive')) {
      return 'Your account has been disabled. Please contact support.';
    }
    return 'Access denied. Please contact support if you believe this is an error.';
  };

  const handleDefaultError = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('company') && lowerMessage.includes('inactive')) {
      return 'Your company account is inactive. Please contact support.';
    }
    if (lowerMessage.includes('validation')) {
      return 'Please check your email and password format.';
    }
    return message;
  };

  const handleNetworkError = (error: unknown): string | null => {
    if (!error || typeof error !== 'object') return null;

    if ('status' in error) {
      const statusError = error as { status: number | string };
      if (statusError.status === 'FETCH_ERROR' || statusError.status === 'PARSING_ERROR') {
        return 'Unable to connect to the server. Please check your internet connection.';
      }
    }

    if ('code' in error) {
      const networkError = error as { code: string };
      if (networkError.code === 'NETWORK_ERROR' || networkError.code === 'ERR_NETWORK') {
        return 'Unable to connect to the server. Please check your internet connection.';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setWasSubmitted(true);

    if (!validateForm()) {
      addToast({
        title: 'Validation Error',
        description: 'Please fill up the form properly before you click submit',
        color: 'warning',
        variant: 'flat',
      });
      return;
    }

    try {
      console.log('Attempting login with:', { email: formData.email, password: '***' });
      const result = await login(formData).unwrap();
      console.log('Login successful:', result);

      addToast({
        title: 'Login Successful',
        description: `Welcome back, ${result.user.firstName || result.user.email}!`,
        color: 'success',
        variant: 'flat',
      });

      dispatch(clearRegistrationCredentials());
      dispatch(setCredentials(result));
      router.push(ROUTE_PATHS.ONBOARDING);
    } catch (err: unknown) {
      console.error('Login failed:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));

      const toastError = getToastErrorMessage(err);
      const detailedMessage = getDetailedErrorMessage(err);

      if (toastError.correlationId) {
        console.error('Error correlation ID:', toastError.correlationId);
      }

      addToast({
        title: toastError.title,
        description: detailedMessage,
        color: 'danger',
        variant: 'flat',
      });
    }
  };

  return (
    <LoginLayout
      formData={formData}
      fieldErrors={fieldErrors}
      wasSubmitted={wasSubmitted}
      isLoading={isLoading}
      onFieldChange={handleFieldChange}
      onSubmit={handleSubmit}
    />
  );
}
