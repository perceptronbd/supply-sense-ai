import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

/**
 * Interface representing an authenticated user after JWT validation
 * Updated for multi-tenant SaaS architecture
 */
export interface AuthenticatedUser {
  /**
   * User's unique identifier
   */
  id: string;

  /**
   * User's email address
   */
  email: string;

  /**
   * Username (same as email in this application)
   */
  username: string;

  /**
   * Company ID the user belongs to (tenant isolation)
   */
  companyId: string;

  /**
   * User's roles (array of role names)
   */
  roles: string[];

  /**
   * User's permissions (array of permission strings)
   */
  permissions: string[];

  /**
   * Branch IDs the user has access to
   */
  branchIds: string[];

  /**
   * User's first name
   */
  firstName: string;

  /**
   * User's last name
   */
  lastName: string;

  /**
   * Whether the user is a super admin
   */
  isSuperAdmin: boolean;
}

/**
 * Parameter decorator to inject the current authenticated user into a route handler
 *
 * @example
 * ```typescript
 * @Get('profile')
 * async getProfile(@CurrentUser() user: AuthenticatedUser) {
 *   return { message: `Hello ${user.firstName}!` };
 * }
 * ```
 *
 * @param data - Optional property name to extract from user object
 * @returns The authenticated user object or specific property if data is provided
 */
export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthenticatedUser | undefined,
    ctx: ExecutionContext
  ): AuthenticatedUser | AuthenticatedUser[keyof AuthenticatedUser] => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    return data ? user?.[data] : user;
  }
);
