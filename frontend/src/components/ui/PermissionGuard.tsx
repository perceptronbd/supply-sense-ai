import { usePermissions } from '@/hooks/usePermissions';
import React, { type ReactNode } from 'react';

/**
 * PermissionGuard component for conditional rendering and disabling based on user permissions
 *
 * This component provides three main behaviors:
 * 1. **Hide**: Renders nothing when user lacks permission (default)
 * 2. **Show Fallback**: Renders fallback content when user lacks permission
 * 3. **Show Disabled**: Renders children with disabled state when user lacks permission
 *
 * When `showDisabled` is true, the component:
 * - Applies visual disabled styling (opacity, cursor)
 * - Prevents all user interactions (clicks, keyboard events, focus)
 * - Injects disabled props into child components (disabled, isDisabled, aria-disabled)
 * - Removes elements from tab order
 * - Uses pointer-events: none for complete interaction prevention
 *
 * @example
 * ```tsx
 * // Hide button if user can't create items
 * <PermissionGuard permission={ITEM_PERMISSIONS.CREATE}>
 *   <Button>Create Item</Button>
 * </PermissionGuard>
 *
 * // Show disabled button if user can't create items
 * <PermissionGuard
 *   permission={ITEM_PERMISSIONS.CREATE}
 *   showDisabled={true}
 * >
 *   <Button>Create Item</Button>
 * </PermissionGuard>
 *
 * // Multiple permissions (user needs ANY of these)
 * <PermissionGuard anyPermissions={[ITEM_PERMISSIONS.CREATE, ITEM_PERMISSIONS.UPDATE]}>
 *   <Button>Modify Item</Button>
 * </PermissionGuard>
 *
 * // Multiple permissions (user needs ALL of these)
 * <PermissionGuard allPermissions={[ITEM_PERMISSIONS.READ, BRANCH_PERMISSIONS.READ]}>
 *   <ItemBranchReport />
 * </PermissionGuard>
 * ```
 */
interface PermissionGuardProps {
  /** The content to conditionally render/disable */
  readonly children: ReactNode;

  /** Single permission required for access */
  readonly permission?: string;

  /** Multiple permissions - user needs ANY of these (OR logic) */
  readonly anyPermissions?: string[];

  /** Multiple permissions - user needs ALL of these (AND logic) */
  readonly allPermissions?: string[];

  /**
   * Content to render when user lacks permission (default: null = hide)
   * Ignored when showDisabled is true
   */
  readonly fallback?: ReactNode;

  /**
   * Whether to render children in disabled state instead of hiding them
   * When true, applies disabledClassName and prevents all interactions
   */
  readonly showDisabled?: boolean;

  /**
   * CSS className to apply when showing disabled state
   * @default 'opacity-50 cursor-not-allowed'
   */
  readonly disabledClassName?: string;
}

/**
 * Helper function to clone child elements with disabled props
 * Extracted to reduce cognitive complexity
 */
function cloneChildWithDisabledProps(child: ReactNode): ReactNode {
  if (!React.isValidElement(child)) {
    return child;
  }

  // Try to inject disabled props for common interactive elements
  const childProps: Record<string, unknown> = {
    disabled: true,
    'aria-disabled': true,
    tabIndex: -1,
  };

  // For HeroUI components, use isDisabled prop
  if ('isDisabled' in (child.props as object)) {
    childProps.isDisabled = true;
  }

  // For form elements and buttons
  if (
    child.type === 'button' ||
    child.type === 'input' ||
    child.type === 'textarea' ||
    child.type === 'select' ||
    child.type === 'form'
  ) {
    childProps.disabled = true;
  }

  try {
    return React.cloneElement(child, childProps);
  } catch {
    // If cloning fails, return original child
    return child;
  }
}

export function PermissionGuard({
  children,
  permission,
  anyPermissions,
  allPermissions,
  fallback = null,
  showDisabled = false,
  disabledClassName = 'opacity-50 cursor-not-allowed',
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let hasRequiredPermission = true;

  // Check single permission
  if (permission) {
    hasRequiredPermission = hasPermission(permission);
  }

  // Check any permissions (OR logic)
  if (anyPermissions && anyPermissions.length > 0) {
    hasRequiredPermission = hasAnyPermission(anyPermissions);
  }

  // Check all permissions (AND logic)
  if (allPermissions && allPermissions.length > 0) {
    hasRequiredPermission = hasAllPermissions(allPermissions);
  }

  // If user has permission, render children normally
  if (hasRequiredPermission) {
    return <>{children}</>;
  }

  // If user doesn't have permission
  if (showDisabled) {
    // Prevent all user interactions when disabled
    const handleInteractionPrevention = (event: React.SyntheticEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
      // Prevent Enter, Space, and other activation keys
      if (
        event.key === 'Enter' ||
        event.key === ' ' ||
        event.key === 'Spacebar' ||
        event.key === 'Tab'
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    return (
      <div
        className={disabledClassName}
        aria-disabled="true"
        role="presentation"
        style={{ pointerEvents: 'none' }}
        onClick={handleInteractionPrevention}
        onMouseDown={handleInteractionPrevention}
        onMouseUp={handleInteractionPrevention}
        onKeyDown={handleKeyDown}
        onKeyUp={handleInteractionPrevention}
        onFocus={handleInteractionPrevention}
        onSubmit={handleInteractionPrevention}
        onDoubleClick={handleInteractionPrevention}
        onContextMenu={handleInteractionPrevention}
        tabIndex={-1} // Remove from tab order
      >
        {/* Clone children and inject disabled props if possible */}
        {React.Children.map(children, cloneChildWithDisabledProps)}
      </div>
    );
  }

  // Default: render fallback (usually null, hiding the element)
  return <>{fallback}</>;
}

/*
 * USAGE EXAMPLES:
 *
 * 1. **Basic Usage - Hide when no permission:**
 * ```tsx
 * <PermissionGuard permission={ITEM_PERMISSIONS.CREATE}>
 *   <Button onClick={createItem}>Create Item</Button>
 * </PermissionGuard>
 * ```
 *
 * 2. **Show Disabled State:**
 * ```tsx
 * <PermissionGuard permission={ITEM_PERMISSIONS.UPDATE} showDisabled={true}>
 *   <Button onClick={updateItem}>Update Item</Button>
 * </PermissionGuard>
 * ```
 *
 * 3. **Form with Custom Disabled Styling:**
 * ```tsx
 * <PermissionGuard
 *   permission={USER_PERMISSIONS.UPDATE}
 *   showDisabled={true}
 *   disabledClassName="opacity-30 cursor-not-allowed grayscale"
 * >
 *   <form onSubmit={handleSubmit}>
 *     <Input name="username" />
 *     <Input name="email" type="email" />
 *     <Button type="submit">Save Changes</Button>
 *   </form>
 * </PermissionGuard>
 * ```
 *
 * 4. **Complex Permissions with Fallback:**
 * ```tsx
 * <PermissionGuard
 *   anyPermissions={[ITEM_PERMISSIONS.CREATE, ITEM_PERMISSIONS.UPDATE]}
 *   fallback={<div>You need create or update permissions to modify items.</div>}
 * >
 *   <ItemEditForm />
 * </PermissionGuard>
 * ```
 *
 * 5. **Advanced Hook Usage (for complex scenarios):**
 * ```tsx
 * function ComplexComponent() {
 *   const { getPermissionState } = usePermissions();
 *
 *   const submitState = getPermissionState({
 *     allPermissions: [PURCHASE_REQUEST_PERMISSIONS.SUBMIT, BRANCH_PERMISSIONS.READ]
 *   });
 *
 *   const approveState = getPermissionState({
 *     permission: PURCHASE_REQUEST_PERMISSIONS.APPROVE
 *   });
 *
 *   return (
 *     <div>
 *       <Button
 *         {...submitState.disabledProps}
 *         onClick={submitRequest}
 *       >
 *         Submit Request
 *       </Button>
 *
 *       <Button
 *         {...approveState.disabledProps}
 *         onClick={approveRequest}
 *         className={approveState.isDisabled ? 'hidden' : ''}
 *       >
 *         Approve Request
 *       </Button>
 *     </div>
 *   );
 * }
 * ```
 */
