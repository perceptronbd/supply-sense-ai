/**
 * Navigation utilities and hooks for sidebar and menu components
 */

import { usePathname } from 'next/navigation';
import { ROUTE_PATHS } from '@/config/routes';

/**
 * Hook to determine if a navigation item should be highlighted as active
 * Handles both exact matches and nested routes appropriately
 */
export const useNavigation = () => {
  const pathname = usePathname();

  /**
   * Check if a navigation item should be highlighted as active
   * @param href - The navigation item's href
   * @param matchMode - How to match the route ('exact' | 'startsWith' | 'auto')
   * @returns boolean indicating if the item is active
   */
  const isActive = (href: string, matchMode: 'exact' | 'startsWith' | 'auto' = 'auto') => {
    if (matchMode === 'exact') {
      return pathname === href;
    }

    if (matchMode === 'startsWith') {
      return pathname.startsWith(href);
    }

    // Auto mode: smart detection based on route patterns
    if (matchMode === 'auto') {
      // Root gets exact match to avoid conflicts with other routes
      if (href === ROUTE_PATHS.ROOT) {
        return pathname === href;
      }

      // All other routes use startsWith to handle nested routes
      return pathname.startsWith(href);
    }

    return false;
  };

  /**
   * Get the active route from a list of navigation items
   * @param items - Array of navigation items with href property
   * @returns The active navigation item or undefined
   */
  const getActiveItem = <T extends { href: string }>(items: T[]): T | undefined => {
    return items.find((item) => isActive(item.href));
  };

  /**
   * Check if the current route is a nested route
   * @param baseRoute - The base route to check against
   * @returns boolean indicating if current route is nested under baseRoute
   */
  const isNestedRoute = (baseRoute: string): boolean => {
    return pathname.startsWith(baseRoute) && pathname !== baseRoute;
  };

  /**
   * Get the parent route from the current pathname
   * @returns The parent route path or null if at root level
   */
  const getParentRoute = (): string | null => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length <= 1) return null;

    return `/${segments[0]}`;
  };

  return {
    pathname,
    isActive,
    getActiveItem,
    isNestedRoute,
    getParentRoute,
  };
};

/**
 * Navigation configuration with route information
 */
export interface NavigationItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  children?: NavigationItem[];
}

/**
 * Default navigation configuration
 */
export const defaultNavigation: NavigationItem[] = [
  {
    name: 'AI Chat',
    href: ROUTE_PATHS.CHAT,
  },
  {
    name: 'Purchase Requests',
    href: ROUTE_PATHS.PURCHASE_REQUESTS,
  },
  {
    name: 'Purchase Orders',
    href: ROUTE_PATHS.PURCHASE_ORDERS,
  },
  {
    name: 'Goods Receipts',
    href: ROUTE_PATHS.GOODS_RECEIPTS,
  },
];
