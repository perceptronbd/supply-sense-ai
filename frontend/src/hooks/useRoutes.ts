/**
 * Custom hooks for route management and navigation
 */

import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import {
  ROUTE_PATHS,
  type RouteConfig,
  type RoutePath,
  getRouteConfig,
  isAuthRoute,
  isProtectedRoute,
  isPublicRoute,
} from '../config/routes';

/**
 * Hook for route information and navigation utilities
 */
export const useRoutes = () => {
  const pathname = usePathname();
  const router = useRouter();

  // Current route information
  const currentRoute = pathname as RoutePath;
  const currentRouteConfig = getRouteConfig(currentRoute);

  // Route type checks for current path
  const isCurrentRouteProtected = isProtectedRoute(pathname);
  const isCurrentRouteAuth = isAuthRoute(pathname);
  const isCurrentRoutePublic = isPublicRoute(pathname);

  // Navigation helpers with type safety
  const navigateTo = useCallback(
    (route: RoutePath) => {
      router.push(route);
    },
    [router]
  );

  const navigateToLogin = useCallback(() => {
    router.push(ROUTE_PATHS.LOGIN);
  }, [router]);

  const navigateToDashboard = useCallback(() => {
    router.push(ROUTE_PATHS.DASHBOARD);
  }, [router]);

  const navigateToHome = useCallback(() => {
    router.push(ROUTE_PATHS.ROOT);
  }, [router]);

  // Route validation utilities
  const checkRouteAccess = useCallback((route: RoutePath, isAuthenticated: boolean) => {
    const config = getRouteConfig(route);
    if (!config) return false;

    if (config.requiresAuth && !isAuthenticated) {
      return false;
    }

    if (config.redirectIfAuthenticated && isAuthenticated) {
      return false;
    }

    return true;
  }, []);

  return {
    // Current route info
    currentRoute,
    currentRouteConfig,
    pathname,

    // Route type checks
    isCurrentRouteProtected,
    isCurrentRouteAuth,
    isCurrentRoutePublic,

    // Navigation helpers
    navigateTo,
    navigateToLogin,
    navigateToDashboard,
    navigateToHome,

    // Route utilities
    checkRouteAccess,

    // Route constants for easy access
    ROUTES: ROUTE_PATHS,
  };
};

/**
 * Hook for checking if a specific route is accessible
 */
export const useRouteAccess = (route: RoutePath) => {
  const config = getRouteConfig(route);

  return {
    routeConfig: config,
    requiresAuth: config?.requiresAuth ?? false,
    redirectIfAuthenticated: config?.redirectIfAuthenticated ?? false,
    isProtected: isProtectedRoute(route),
    isAuth: isAuthRoute(route),
    isPublic: isPublicRoute(route),
  };
};

/**
 * Hook for getting route metadata (title, description, etc.)
 */
export const useRouteMetadata = (route?: RoutePath) => {
  const pathname = usePathname();
  const targetRoute = route || (pathname as RoutePath);
  const config = getRouteConfig(targetRoute);

  return {
    title: config?.title,
    description: config?.description,
    path: config?.path,
  };
};
