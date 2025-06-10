'use client';

import { Button, Card, CardBody, CardHeader, Input } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import AuthGuard from '../../components/AuthGuard';
import { useLoginMutation } from '../../store/api/authApi';
import { setCredentials } from '../../store/slices/authSlice';

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
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Login failed:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
    }
  };

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
              <p className="text-default-500 mt-1">Sign in to your Supply Chain AI account</p>
            </div>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                type="email"
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                isRequired
                labelPlacement="inside"
                variant="bordered"
              />

              <Input
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                isRequired
                labelPlacement="inside"
                variant="bordered"
              />

              {error && (
                <div className="text-danger text-sm text-center">
                  {'data' in error &&
                  error.data &&
                  typeof error.data === 'object' &&
                  'message' in error.data
                    ? (error.data.message as string) || 'Login failed'
                    : 'An error occurred'}
                </div>
              )}

              <Button type="submit" color="primary" className="w-full" isLoading={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Test credentials info */}
            <Card className="mt-6" radius="sm">
              <CardBody className="p-3">
                <p className="text-primary font-medium text-sm">Test Credentials:</p>
                <p className="text-default-600 text-sm">Email: manager.a@supplychain.com</p>
                <p className="text-default-600 text-sm">Password: manager123</p>
              </CardBody>
            </Card>
          </CardBody>
        </Card>
      </div>
    </AuthGuard>
  );
}
