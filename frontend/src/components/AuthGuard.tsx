'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && !isAuthenticated && !token) {
      router.push('/login');
    } else if (!requireAuth && isAuthenticated && token) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, token, router, requireAuth]);

  if (requireAuth && !isAuthenticated && !token) {
    return null; // or a loading spinner
  }

  if (!requireAuth && isAuthenticated && token) {
    return null; // redirect to dashboard
  }

  return <>{children}</>;
}
