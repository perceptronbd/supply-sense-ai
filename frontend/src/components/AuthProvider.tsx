'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { validateToken } from '../store/slices/authSlice';
import type { RootState } from '../store/store';

interface AuthProviderProps {
  children: React.ReactNode;
}

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/purchase-requests',
  '/purchase-orders',
  '/goods-receipts',
  '/chat',
  '/items',
  '/suppliers',
  '/manufacturing-list',
  '/material-requisition',
  '/branches',
  '/request-forms',
];

// Routes that should redirect to dashboard if user is authenticated
const authRoutes = ['/login'];

export default function AuthProvider({ children }: AuthProviderProps) {
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Validate token on mount after Redux Persist has rehydrated
    dispatch(validateToken());
  }, [dispatch]);

  useEffect(() => {
    if (!isMounted) return;
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
    const isAuthRoute = authRoutes.includes(pathname);

    // Handle authentication logic
    if (isProtectedRoute && !isAuthenticated && !token) {
      // User trying to access protected route without authentication
      setIsNavigating(true);
      router.push('/login');
      return;
    }

    if (isAuthRoute && isAuthenticated && token) {
      // Authenticated user trying to access login page
      setIsNavigating(true);
      router.push('/dashboard');
      return;
    }

    // Reset navigation state for valid routes
    setIsNavigating(false);
  }, [isAuthenticated, token, pathname, router, isMounted]);

  // Show loading state during initial mount to prevent hydration mismatches
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <div className="text-foreground text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  // Show loading state during navigation
  if (isNavigating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <div className="text-foreground text-sm">Redirecting...</div>
        </div>
      </div>
    );
  }

  // Check if user should see content
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.includes(pathname);

  // Don't render protected content if user is not authenticated
  if (isProtectedRoute && !isAuthenticated && !token) {
    return null;
  }

  // Don't render auth pages if user is already authenticated
  if (isAuthRoute && isAuthenticated && token) {
    return null;
  }

  return <>{children}</>;
}
