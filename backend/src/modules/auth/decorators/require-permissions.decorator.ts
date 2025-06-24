import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../types/permissions.types';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for a route
 * @param permissions - Array of permission strings in format "MODULE:ACTION"
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
