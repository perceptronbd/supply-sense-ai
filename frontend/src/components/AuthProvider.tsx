'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRoutes } from '../hooks/useRoutes';
import { validateToken } from '../store/slices/authSlice';
import type { RootState } from '../store/store';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const { isCurrentRouteProtected, isCurrentRouteAuth, navigateToLogin, navigateToDashboard } =
    useRoutes();
  const [isMounted, setIsMounted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Validate token on mount after Redux Persist has rehydrated
    dispatch(validateToken());
  }, [dispatch]);

  useEffect(() => {
    if (!isMounted) return;

    // Handle authentication logic
    if (isCurrentRouteProtected && !isAuthenticated && !token) {
      // User trying to access protected route without authentication
      setIsNavigating(true);
      navigateToLogin();
      return;
    }

    if (isCurrentRouteAuth && isAuthenticated && token) {
      // Authenticated user trying to access login page
      setIsNavigating(true);
      navigateToDashboard();
      return;
    }

    // Reset navigation state for valid routes
    setIsNavigating(false);
  }, [
    isAuthenticated,
    token,
    isCurrentRouteProtected,
    isCurrentRouteAuth,
    navigateToLogin,
    navigateToDashboard,
    isMounted,
  ]);

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
  // Don't render protected content if user is not authenticated
  if (isCurrentRouteProtected && !isAuthenticated && !token) {
    return null;
  }

  // Don't render auth pages if user is already authenticated
  if (isCurrentRouteAuth && isAuthenticated && token) {
    return null;
  }

  return <>{children}</>;
}
