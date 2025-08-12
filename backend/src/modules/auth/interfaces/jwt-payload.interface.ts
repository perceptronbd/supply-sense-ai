/**
 * JWT Payload structure - This represents what is stored in the JWT token
 * Updated for multi-tenant SaaS architecture
 */
export interface JwtPayload {
  /**
   * User's email address
   */
  username: string;

  /**
   * User's ID (as sub claim)
   */
  sub: string;

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

  /**
   * Token issued at timestamp
   */
  iat?: number;

  /**
   * Token expiration timestamp
   */
  exp?: number;
}
