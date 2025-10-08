'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId } from 'react';
import { useSelector } from 'react-redux';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { ROUTE_PATHS } from '@/config/routes';
import type { RootState } from '@/store/store';

export default function Index() {
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const logoId = useId();

  useEffect(() => {
    if (isAuthenticated && token) {
      router.push(ROUTE_PATHS.CHAT);
    } else {
      router.push(ROUTE_PATHS.LOGIN);
    }
  }, [isAuthenticated, token, router]);
  return (
    <main className="min-h-screen flex items-center justify-center">
      <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} id={logoId} />
    </main>
  );
}
