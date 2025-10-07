'use client';

import { addToast, Card, CardBody } from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { z } from 'zod';
import { LogoIcon } from '@/components/icons/LogoIcon';
import { SupplySenseTextIcon } from '@/components/icons/SupplySenseTextIcon';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { ROUTE_PATHS } from '@/config/routes';
import { getToastErrorMessage } from '@/lib/utils/api-response';
import { useLoginMutation } from '@/store/api/authApi';
import { setCredentials } from '@/store/slices/authSlice';

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
      router.push(ROUTE_PATHS.ONBOARDING);
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
    <main className="min-h-screen bg-content2 flex items-center justify-center p-4">
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 place-items-center">
          {/* Welcome Section - Left Side */}
          <section className="w-full flex items-center justify-center">
            <div className="text-center ml-6 lg:text-left space-y-6 max-w-3xl">
              <header>
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                  <LogoIcon className="w-12 h-12" />
                  <SupplySenseTextIcon className="h-10" />
                </div>
                <Text variant="display" as="h1" weight="bold" className="text-foreground mb-4">
                  Welcome Back
                </Text>
                <Text variant="headerSmall" as="h2" className="text-primary-700 mb-6">
                  Sign in to your SupplySense account
                </Text>
              </header>

              <div className="space-y-4">
                <Text variant="bodyLarge" as="p" className="text-foreground-700">
                  Continue managing your supply chain operations with ease.
                </Text>

                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full" />
                    <Text variant="bodyMedium" as="span" className="text-foreground-600">
                      Real-time inventory tracking and monitoring
                    </Text>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full" />
                    <Text variant="bodyMedium" as="span" className="text-foreground-600">
                      Streamlined purchase and manufacturing workflows
                    </Text>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full" />
                    <Text variant="bodyMedium" as="span" className="text-foreground-600">
                      AI-powered insights and recommendations
                    </Text>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full" />
                    <Text variant="bodyMedium" as="span" className="text-foreground-600">
                      Secure multi-tenant data isolation
                    </Text>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Login Form - Right Side */}
          <section className="max-w-xl">
            <Card className="shadow-2xl border-0">
              <CardBody className="p-8">
                <header className="text-center mb-6">
                  <Text variant="headerMedium" as="h3" className="text-foreground mb-2">
                    Sign In
                  </Text>
                  <Text variant="bodyBase" as="p" className="text-foreground-600">
                    Access your SupplySense dashboard
                  </Text>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  <ValidatedInput
                    name="email"
                    type="email"
                    label="Email Address"
                    placeholder="Enter your email address"
                    isRequired
                    variant="bordered"
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

                {/* Registration Link */}
                <div className="text-center mt-6">
                  <Text variant="bodySmall" as="p" className="text-foreground-600">
                    Don't have an account?{' '}
                    <Link
                      href={ROUTE_PATHS.REGISTER}
                      className="text-secondary-500 hover:text-primary-700 font-medium"
                    >
                      Register your company
                    </Link>
                  </Text>
                </div>

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
                          admin@test.com / Admin@123
                        </Text>
                      </div>
                      <Button
                        size="sm"
                        variant="light"
                        color="primary"
                        className="text-xs px-2 py-1 h-auto min-h-0"
                        onPress={() => handleDemoLogin('admin@test.com', 'Admin@123')}
                      >
                        Use
                      </Button>
                    </div>
                  </div>
                </aside>
              </CardBody>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}
