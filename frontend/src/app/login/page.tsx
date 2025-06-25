'use client';

import { LogoIcon } from '@/components/icons/LogoIcon';
import { SupplySenseTextIcon } from '@/components/icons/SupplySenseTextIcon';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { ROUTE_PATHS } from '@/config/routes';
import { useLoginMutation } from '@/store/api/authApi';
import { setCredentials } from '@/store/slices/authSlice';
import { Card, CardBody } from '@heroui/react';
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
  const [login, { isLoading, error }] = useLoginMutation();
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setWasSubmitted(true);

    if (!validateForm()) {
      return;
    }

    try {
      console.log('Attempting login with:', { email: formData.email, password: '***' });
      const result = await login(formData).unwrap();
      console.log('Login successful:', result);
      dispatch(setCredentials(result));
      router.push(ROUTE_PATHS.DASHBOARD);
    } catch (err: unknown) {
      console.error('Login failed:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
    }
  };

  const getErrorMessage = (error: unknown): string => {
    if (
      error &&
      typeof error === 'object' &&
      'data' in error &&
      error.data &&
      typeof error.data === 'object' &&
      'message' in error.data
    ) {
      return (error.data.message as string) || 'Login failed';
    }
    return 'An error occurred during login';
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

                {error && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="p-3 bg-danger-50 border border-danger-200 rounded-medium"
                  >
                    <Text variant="bodySmall" color="danger" as="p">
                      {getErrorMessage(error)}
                    </Text>
                  </div>
                )}

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
                <Text variant="bodySmall" className="font-medium mb-2">
                  Demo Account:
                </Text>
                <Text variant="bodyXSmall" color="muted" as="p">
                  manager.a@supplychain.com / manager123
                </Text>
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
