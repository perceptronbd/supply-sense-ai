'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Text } from '../components/ui/Text';
import type { RootState } from '../store/store';

export default function Index() {
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, token, router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Text variant="headerMedium" weight="semiBold" className="text-gray-700" as="h1">
          Loading...
        </Text>
      </div>
    </main>
  );
}
