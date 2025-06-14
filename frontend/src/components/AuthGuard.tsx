'use client';

import { DrawingLogo } from '@/components/ui/DrawingLogo';
import type { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (requireAuth && !isAuthenticated && !token) {
      router.push('/login');
    } else if (!requireAuth && isAuthenticated && token) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, token, router, requireAuth, isMounted]);

  // Don't render anything until mounted to prevent hydration mismatches
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <DrawingLogo
          size={60}
          variant="primary"
          speed="fast"
          showFill={true}
          id="auth-guard-mount"
        />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated && !token) {
    return null; // or a loading spinner
  }

  if (!requireAuth && isAuthenticated && token) {
    return null; // redirect to dashboard
  }

  return <>{children}</>;
}
