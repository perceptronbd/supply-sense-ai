import { type ExecutionContext, createParamDecorator } from '@nestjs/common';

/**
 * Interface representing an authenticated user after JWT validation
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
   * User's role (SYSTEM_ADMIN, BRANCH_MANAGER, etc.)
   */
  role: string;

  /**
   * User's first name
   */
  firstName: string;

  /**
   * User's last name
   */
  lastName: string;

  /**
   * ID of the branch the user belongs to
   */
  branchId: string;
}

/**
 * Decorator to extract the current authenticated user from the request
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
