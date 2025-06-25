'use client';

import { LogoIcon } from '@/components/icons/LogoIcon';
import { SupplySenseTextIcon } from '@/components/icons/SupplySenseTextIcon';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { ROUTE_PATHS } from '@/config/routes';
import { getToastErrorMessage } from '@/lib/utils/api-response';
import { useLoginMutation } from '@/store/api/authApi';
import { setCredentials } from '@/store/slices/authSlice';
import { Card, CardBody, addToast } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { z } from 'zod';

// Login form validation schema
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

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

    // Clear field errors when user starts typing
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

    // Convert Zod errors to field errors
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
    // Handle RTK Query errors with backend ApiErrorResponseDto structure
    if (error && typeof error === 'object' && 'data' in error) {
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

      if (rtkError.data?.message) {
        const backendMessage = rtkError.data.message;
        const statusCode = rtkError.data.statusCode || rtkError.status;

        // Provide user-friendly messages based on status codes
        switch (statusCode) {
          case 401:
            // Check if it's a specific auth error or generic 401
            if (
              backendMessage.toLowerCase().includes('invalid') ||
              backendMessage.toLowerCase().includes('wrong') ||
              backendMessage.toLowerCase().includes('incorrect')
            ) {
              return 'Invalid email or password. Please check your credentials and try again.';
            }
            return 'Authentication failed. Please check your credentials and try again.';

          case 403:
            if (
              backendMessage.toLowerCase().includes('disabled') ||
              backendMessage.toLowerCase().includes('inactive')
            ) {
              return 'Your account has been disabled. Please contact support.';
            }
            return 'Access denied. Please contact support if you believe this is an error.';

          case 404:
            return 'Login service not found. Please try again later.';

          case 429:
            return 'Too many login attempts. Please wait a few minutes before trying again.';

          case 500:
            return 'Server error. Please try again later.';

          case 503:
            return 'Service temporarily unavailable. Please try again later.';

          default:
            // Use the backend message for other cases, but make it user-friendly
            if (
              backendMessage.toLowerCase().includes('company') &&
              backendMessage.toLowerCase().includes('inactive')
            ) {
              return 'Your company account is inactive. Please contact support.';
            }
            if (backendMessage.toLowerCase().includes('validation')) {
              return 'Please check your email and password format.';
            }
            // Return the backend message as-is if it's already user-friendly
            return backendMessage;
        }
      }
    }

    // Handle network errors
    if (error && typeof error === 'object') {
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
    }

    // Fallback to the utility function or default message
    const toastError = getToastErrorMessage(error);
    return toastError.description || 'An unexpected error occurred. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setWasSubmitted(true);

    if (!validateForm()) {
      addToast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form before submitting.',
        color: 'warning',
        variant: 'flat',
      });
      return;
    }

    try {
      console.log('Attempting login with:', { email: formData.email, password: '***' });
      const result = await login(formData).unwrap();
      console.log('Login successful:', result);

      // Show success toast
      addToast({
        title: 'Login Successful',
        description: `Welcome back, ${result.user.firstName || result.user.email}!`,
        color: 'success',
        variant: 'flat',
      });

      dispatch(setCredentials(result));
      router.push(ROUTE_PATHS.DASHBOARD);
    } catch (err: unknown) {
      console.error('Login failed:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));

      // Get enhanced error information for debugging
      const toastError = getToastErrorMessage(err);
      const detailedMessage = getDetailedErrorMessage(err);

      // Log correlation ID for debugging if available
      if (toastError.correlationId) {
        console.error('Error correlation ID:', toastError.correlationId);
      }

      // Show detailed error toast with appropriate title
      addToast({
        title: toastError.title,
        description: detailedMessage,
        color: 'danger',
        variant: 'flat',
      });
    }
  };

  const handleDemoLogin = (email: string, password: string) => {
    setFormData({ email, password });
    setFieldErrors({});
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo Section */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <LogoIcon size={40} className="text-primary" aria-hidden="true" />
            <SupplySenseTextIcon size={160} className="text-foreground" aria-hidden="true" />
          </div>
          <Text variant="headerMedium" as="h1" className="mb-2">
            Welcome Back
          </Text>
          <Text variant="bodyBase" color="muted" as="p">
            Sign in to continue to your supply chain dashboard
          </Text>
        </header>

        {/* Login Form */}
        <section aria-labelledby="login-form-title">
          <Card className="bg-content1 shadow-medium">
            <CardBody className="p-6">
              <Text id="login-form-title" variant="titleSmall" className="sr-only">
                Login Form
              </Text>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <ValidatedInput
                  name="email"
                  type="email"
                  label="Email Address"
                  placeholder="Enter your email address"
                  isRequired
                  variant="bordered"
                  labelPlacement="inside"
                  fieldSchema={loginSchema.shape.email}
                  wasSubmitted={wasSubmitted}
                  errors={fieldErrors.email}
                  defaultValue={formData.email}
                  onValueChange={handleFieldChange}
                  autoComplete="email"
                  autoFocus
                />

                <ValidatedInput
                  name="password"
                  type="password"
                  label="Password"
                  placeholder="Enter your password"
                  isRequired
                  variant="bordered"
                  labelPlacement="inside"
                  fieldSchema={loginSchema.shape.password}
                  wasSubmitted={wasSubmitted}
                  errors={fieldErrors.password}
                  defaultValue={formData.password}
                  onValueChange={handleFieldChange}
                  autoComplete="current-password"
                />

                <Button
                  type="submit"
                  color="primary"
                  className="w-full"
                  isLoading={isLoading}
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              {/* Demo credentials */}
              <aside className="mt-6 p-4 bg-default-50 rounded-medium">
                <Text variant="bodySmall" className="font-medium mb-3">
                  Demo Accounts:
                </Text>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <Text variant="bodyXSmall" color="muted" as="p" className="font-medium">
                        Branch Manager:
                      </Text>
                      <Text variant="bodyXSmall" color="muted" as="p">
                        manager.a@company001.com / manager123
                      </Text>
                    </div>
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
                      className="text-xs px-2 py-1 h-auto min-h-0"
                      onPress={() => handleDemoLogin('manager.a@company001.com', 'manager123')}
                    >
                      Use
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <Text variant="bodyXSmall" color="muted" as="p" className="font-medium">
                        Inventory Clerk:
                      </Text>
                      <Text variant="bodyXSmall" color="muted" as="p">
                        clerk.a@company001.com / clerk123
                      </Text>
                    </div>
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
                      className="text-xs px-2 py-1 h-auto min-h-0"
                      onPress={() => handleDemoLogin('clerk.a@company001.com', 'clerk123')}
                    >
                      Use
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <Text variant="bodyXSmall" color="muted" as="p" className="font-medium">
                        Admin:
                      </Text>
                      <Text variant="bodyXSmall" color="muted" as="p">
                        admin@company001.com / admin123
                      </Text>
                    </div>
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
                      className="text-xs px-2 py-1 h-auto min-h-0"
                      onPress={() => handleDemoLogin('admin@company001.com', 'admin123')}
                    >
                      Use
                    </Button>
                  </div>
                </div>
              </aside>
            </CardBody>
          </Card>
        </section>

        <footer className="text-center mt-6">
          <Text variant="bodySmall" color="muted" as="p">
            © 2025 SupplySense. All rights reserved.
          </Text>
        </footer>
      </div>
    </main>
  );
}
