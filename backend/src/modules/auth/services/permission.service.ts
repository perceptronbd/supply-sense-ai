import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Service for checking permissions and access rights in multi-tenant environment
 */
@Injectable()
export class PermissionService {
  /**
   * Check if user has a specific permission
   */
  hasPermission(user: AuthenticatedUser, module: string, action: string): boolean {
    if (user.isSuperAdmin) {
      return true;
    }
    return user.permissions?.includes(`${module}:${action}`) || false;
  }

  /**
   * Check if user has any of the required permissions
   */
  hasAnyPermission(user: AuthenticatedUser, permissions: string[]): boolean {
    if (user.isSuperAdmin) {
      return true;
    }
    return permissions.some((permission) => user.permissions?.includes(permission));
  }

  /**
   * Check if user has all of the required permissions
   */
  hasAllPermissions(user: AuthenticatedUser, permissions: string[]): boolean {
    if (user.isSuperAdmin) {
      return true;
    }
    return permissions.every((permission) => user.permissions?.includes(permission));
  }

  /**
   * Check if user has access to a specific branch
   */
  hasAccessToBranch(user: AuthenticatedUser, branchId: string): boolean {
    if (user.isSuperAdmin) {
      return true;
    }
    return user.branchIds?.includes(branchId) || false;
  }

  /**
   * Check if user has a specific role
   */
  hasRole(user: AuthenticatedUser, roleName: string): boolean {
    if (user.isSuperAdmin) {
      return true;
    }
    return user.roles?.includes(roleName) || false;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(user: AuthenticatedUser, roleNames: string[]): boolean {
    if (user.isSuperAdmin) {
      return true;
    }
    return roleNames.some((role) => user.roles?.includes(role));
  }

  /**
   * Get permissions for a specific module
   */
  getModulePermissions(user: AuthenticatedUser, module: string): string[] {
    if (user.isSuperAdmin) {
      // Super admin has all permissions - return common actions for the module
      return [
        `${module}:CREATE`,
        `${module}:VIEW`,
        `${module}:EDIT`,
        `${module}:DELETE`,
        `${module}:APPROVE`,
      ];
    }

    return user.permissions?.filter((permission) => permission.startsWith(`${module}:`)) || [];
  }

  /**
   * Check if user belongs to the same company as the requested resource
   */
  validateCompanyAccess(user: AuthenticatedUser, resourceCompanyId: string): boolean {
    return user.companyId === resourceCompanyId;
  }

  /**
   * Get user's accessible branch IDs
   */
  getAccessibleBranchIds(user: AuthenticatedUser): string[] {
    return user.branchIds || [];
  }

  /**
   * Create a company-scoped filter for database queries
   */
  createCompanyFilter(user: AuthenticatedUser): { companyId: string } {
    return { companyId: user.companyId };
  }

  /**
   * Create a branch-scoped filter for database queries
   */
  createBranchFilter(
    user: AuthenticatedUser,
    specificBranchId?: string
  ): { branchId: { in: string[] } } | { branchId: string } {
    if (specificBranchId) {
      // Validate user has access to this specific branch
      if (!this.hasAccessToBranch(user, specificBranchId)) {
        throw new Error(`Access denied to branch: ${specificBranchId}`);
      }
      return { branchId: specificBranchId };
    }

    // Return filter for all accessible branches
    return { branchId: { in: user.branchIds || [] } };
  }

  /**
   * Get user's company and branch context for API responses
   */
  getUserContext(user: AuthenticatedUser) {
    return {
      companyId: user.companyId,
      branchIds: user.branchIds,
      roles: user.roles,
      permissions: user.permissions,
      isSuperAdmin: user.isSuperAdmin,
    };
  }
}
