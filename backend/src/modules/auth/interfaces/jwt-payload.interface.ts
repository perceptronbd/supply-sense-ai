/**
 * JWT Payload structure - This represents what is stored in the JWT token
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
   * User's role
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
   * Branch ID the user belongs to
   */
  branchId: string;

  /**
   * Token issued at timestamp
   */
  iat?: number;

  /**
   * Token expiration timestamp
   */
  exp?: number;
}
