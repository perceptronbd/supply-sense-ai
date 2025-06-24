import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to set required permissions for a route
 * Usage: @RequirePermissions('PURCHASE_REQUESTS:CREATE', 'PURCHASE_REQUESTS:EDIT')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

/**
 * Decorator to require specific company access
 * Usage: @RequireCompanyAccess()
 */
export const RequireCompanyAccess = () => SetMetadata('requireCompanyAccess', true);

/**
 * Decorator to require branch access validation
 * Usage: @RequireBranchAccess()
 */
export const RequireBranchAccess = () => SetMetadata('requireBranchAccess', true);
