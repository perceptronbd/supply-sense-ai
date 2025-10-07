import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';

/**
 * Custom hook for checking user permissions and providing disabled state management
 */
export function usePermissions() {
  const { user } = useSelector((state: RootState) => state.auth);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!user?.permissions) return false;
    return user.permissions.includes(permission);
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user?.permissions) return false;
    return permissions.some((permission) => user.permissions.includes(permission));
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user?.permissions) return false;
    return permissions.every((permission) => user.permissions.includes(permission));
  };

  /**
   * Get disabled state and event handlers for permission-based disabling
   * @param permission - Single permission to check
   * @param anyPermissions - Array of permissions (user needs ANY)
   * @param allPermissions - Array of permissions (user needs ALL)
   * @returns Object with disabled state and prevention handlers
   */
  const getPermissionState = (options: {
    permission?: string;
    anyPermissions?: string[];
    allPermissions?: string[];
  }) => {
    let hasRequiredPermission = true;

    if (options.permission) {
      hasRequiredPermission = hasPermission(options.permission);
    }

    if (options.anyPermissions && options.anyPermissions.length > 0) {
      hasRequiredPermission = hasAnyPermission(options.anyPermissions);
    }

    if (options.allPermissions && options.allPermissions.length > 0) {
      hasRequiredPermission = hasAllPermissions(options.allPermissions);
    }

    const isDisabled = !hasRequiredPermission;

    // Event handlers to prevent interaction when disabled
    const preventInteraction = (event: React.SyntheticEvent) => {
      if (isDisabled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const preventKeyboardActivation = (event: React.KeyboardEvent) => {
      if (isDisabled && (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    return {
      isDisabled,
      hasPermission: hasRequiredPermission,
      // Props to spread on interactive elements
      disabledProps: isDisabled
        ? {
            disabled: true,
            'aria-disabled': true,
            tabIndex: -1,
            onClick: preventInteraction,
            onKeyDown: preventKeyboardActivation,
            style: { pointerEvents: 'none' as const, opacity: 0.5, cursor: 'not-allowed' },
          }
        : {},
      // Event handlers for manual use
      preventInteraction,
      preventKeyboardActivation,
    };
  };

  return {
    user,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissionState,
    userPermissions: user?.permissions || [],
  };
}
