import type { Request } from 'express';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Extended Express Request interface that includes the authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  headers: {
    authorization?: string;
    [key: string]: string | string[] | undefined;
  };
}
