'use client';

import { Loading } from '@/components/ui/Loading';
import { ROUTE_PATHS } from '@/config/routes';
import type { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

export default function Index() {
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && token) {
      router.push(ROUTE_PATHS.DASHBOARD);
    } else {
      router.push(ROUTE_PATHS.LOGIN);
    }
  }, [isAuthenticated, token, router]);
  return (
    <main className="min-h-screen flex items-center justify-center">
      <Loading size="xl" message="Loading..." />
    </main>
  );
}
