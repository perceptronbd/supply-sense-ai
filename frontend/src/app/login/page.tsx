'use client';

import { LogoIcon } from '@/components/icons/LogoIcon';
import { SupplySenseTextIcon } from '@/components/icons/SupplySenseTextIcon';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ROUTE_PATHS } from '@/config/routes';
import { useLoginMutation } from '@/store/api/authApi';
import { setCredentials } from '@/store/slices/authSlice';
import { Card, CardBody, Input } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDispatch } from 'react-redux';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading, error }] = useLoginMutation();
  const dispatch = useDispatch();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Attempting login with:', { email, password: '***' });
      const result = await login({ email, password }).unwrap();
      console.log('Login successful:', result);
      dispatch(setCredentials(result));
      router.push(ROUTE_PATHS.DASHBOARD);
    } catch (err: unknown) {
      console.error('Login failed:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo Section */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <LogoIcon size={40} className="text-primary" />
            <SupplySenseTextIcon size={160} className="text-foreground" />
          </div>
          <Text variant="headerMedium" as="h1" className="mb-2">
            Welcome Back
          </Text>
          <Text variant="bodyBase" color="muted" as="p">
            Sign in to continue
          </Text>
        </header>

        {/* Login Form */}
        <Card className="bg-content1 shadow-medium">
          <CardBody className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                isRequired
                variant="bordered"
                labelPlacement="inside"
              />

              <Input
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                isRequired
                variant="bordered"
                labelPlacement="inside"
              />

              {error && (
                <div className="p-3 bg-danger-50 border border-danger-200 rounded-medium">
                  <Text variant="bodySmall" color="danger" as="p">
                    {/* ...existing error handling... */}
                    {'data' in error &&
                    error.data &&
                    typeof error.data === 'object' &&
                    'message' in error.data
                      ? (error.data.message as string) || 'Login failed'
                      : 'An error occurred during login'}
                  </Text>
                </div>
              )}

              <Button
                type="submit"
                color="primary"
                className="w-full"
                isLoading={isLoading}
                size="lg"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 p-4 bg-default-50 rounded-medium">
              <Text variant="bodySmall" className="font-medium mb-2">
                Demo Account:
              </Text>
              <Text variant="bodyXSmall" color="muted" as="p">
                manager.a@supplychain.com / manager123
              </Text>
            </div>
          </CardBody>
        </Card>

        <footer className="text-center mt-6">
          <Text variant="bodySmall" color="muted" as="p">
            © 2025 SupplySense
          </Text>
        </footer>
      </div>
    </main>
  );
}
