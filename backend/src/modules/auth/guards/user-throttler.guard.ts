import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const user = req.user as AuthenticatedUser;
    // Use the user's ID from the JWT token as the unique tracker.
    return user?.id ? `user-${user.id}` : (req.ip as string); // Fallback to IP if no user
  }
}
